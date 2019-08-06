import { ILocal, IModule } from "../WASM/AST";
import { ASTBuilder } from "../WASM/ASTBuilder";
import { Instruction, NonValueResultType, ValueType } from "../WASM/Encoding/Constants";
import { InstructionSequenceBuilder } from "../WASM/Encoding/InstructionSequenceBuilder";
import { Block, BlockType, FunctionIdentifier, FunctionType, ICompilationUnit, InstructionType, Type, Variable } from "./AST";
import { getWrittenVariables, irFunctionTypesAreEqual, isFloat, isPhiNode, isSigned, mapIRTypeToWasm } from "./Utils";
import { allocateVirtualRegistersToVariables, IBucket } from "./VirtualRegisterAllocator";
export function compileIR(ir: ICompilationUnit): IModule {
  const functionIdentifierIndexMapping: Map<FunctionIdentifier, number> = new Map();
  let i = 0;
  for (const externalFunctionDeclaration of ir.externalFunctionDeclarations) {
    functionIdentifierIndexMapping.set(externalFunctionDeclaration.identifier, i);
    i++;
  }
  for (const internalFunctionDeclaration of ir.internalFunctionDeclarations) {
    functionIdentifierIndexMapping.set(internalFunctionDeclaration.identifier, i);
    i++;
  }
  const allocation = allocateVirtualRegistersToVariables(ir);
  const usageSpanMappings = allocation.usageSpanMappings;
  const functionIdentifierTypeMapping: Map<FunctionIdentifier, FunctionType> = new Map();
  for (const internalFunctionDeclaration of ir.internalFunctionDeclarations) {
    functionIdentifierTypeMapping.set(internalFunctionDeclaration.identifier, internalFunctionDeclaration.type);
  }
  for (const externalFunctionDeclaration of ir.externalFunctionDeclarations) {
    functionIdentifierTypeMapping.set(externalFunctionDeclaration.identifier, externalFunctionDeclaration.type);
  }

  const wasmFunctionTypes: Array<[FunctionType, number]> = [];
  const wasmBuilder = new ASTBuilder();
  for (const externalFunctionDeclaration of ir.externalFunctionDeclarations) {
    const type = externalFunctionDeclaration.type;
    let index = -1;
    const searchResult = wasmFunctionTypes.find((a) => {
      return irFunctionTypesAreEqual(a[0], type);
    });
    if (searchResult !== undefined) {
      index = searchResult[1];
    }
    if (index === -1) {
      const argTypeBuffer: ValueType[] = [];
      for (const argType of type[0]) {
        argTypeBuffer.push(mapIRTypeToWasm(ir, argType));
      }
      const resultType = type[1].length === 1 ? mapIRTypeToWasm(ir, type[1][0]) : undefined;
      index = wasmBuilder.functionTypeIndex(argTypeBuffer, resultType);
      wasmFunctionTypes.push([
        type, index,
      ]);
    }
    wasmBuilder.addFunctionImport("env", externalFunctionDeclaration.externalName, index);
  }

  for (const fn of ir.functionCode) {
    const functionType = functionIdentifierTypeMapping.get(fn.identifier);
    const localTypes = fn.variableTypes;
    if (functionType === undefined) {
      throw new Error();
    }
    const mapping = usageSpanMappings.get(fn.identifier);
    if (mapping === undefined) {
      continue;
    }

    let index = -1;
    const searchResult = wasmFunctionTypes.find((a) => {
      return irFunctionTypesAreEqual(a[0], functionType);
    });
    if (searchResult !== undefined) {
      index = searchResult[1];
    }
    if (index === -1) {
      const argTypeBuffer: ValueType[] = [];
      for (const argType of functionType[0]) {
        argTypeBuffer.push(mapIRTypeToWasm(ir, argType));
      }
      const resultType = functionType[1].length === 1 ? mapIRTypeToWasm(ir, functionType[1][0]) : undefined;
      index = wasmBuilder.functionTypeIndex(argTypeBuffer, resultType);
      wasmFunctionTypes.push([
        functionType, index,
      ]);
    }
    const bucketArray: IBucket[] = [];
    const bucketIndexArray: number[] = [];
    for (const buckets of mapping.values()) {
      for (const bucket of buckets) {
        bucketArray[bucket.index] = bucket;
        for (const value of bucket.variables) {
          bucketIndexArray[value] = bucket.index;
        }
      }
    }

    const variableTypeArray = functionType[0].concat(localTypes);
    const env: ICompilationEnvironment = {
      compilationUnit: ir,
      sequenceBuilderStack: [],
      stack: [],
      functionType,
      functionIdentifierTypeMapping,
      variableTypeArray,
      mapping,
      statementIndex: 0,
      functionIdentifierIndexMapping,
      bucketIndexArray,
      buckets: bucketArray,
      bucketsWrittenToInCurrentBasicBlock: new Set(),
    };
    env.sequenceBuilderStack.push(new InstructionSequenceBuilder());
    env.stack.push([]);

    for (const block of fn.code) {
      compileBlock(env, block);
    }

    const sequenceBuilder = env.sequenceBuilderStack[env.sequenceBuilderStack.length - 1];
    const locals: ILocal[] = [];
    for (const [type, buckets] of mapping.entries()) {
      for (const bucket of buckets) {
        locals.push({
          n: 1,
          type,
        });
      }
    }
    sequenceBuilder.end();
    const wasmFunctionIndex = functionIdentifierIndexMapping.get(fn.identifier);
    if (wasmFunctionIndex === undefined) {
      throw new Error();
    }
    wasmBuilder.addFunction(wasmFunctionIndex, fn.identifier, index, locals, sequenceBuilder.instructions);
  }
  return wasmBuilder.module;
}
export interface ICompilationEnvironment {
  compilationUnit: ICompilationUnit;
  sequenceBuilderStack: InstructionSequenceBuilder[];
  stack: Variable[][];
  functionType: FunctionType;
  functionIdentifierTypeMapping: Map<FunctionIdentifier, FunctionType>;
  variableTypeArray: Type[];
  mapping: Map<ValueType, IBucket[]>;
  statementIndex: number;
  functionIdentifierIndexMapping: Map<FunctionIdentifier, number>;
  bucketIndexArray: number[];
  buckets: IBucket[];
  bucketsWrittenToInCurrentBasicBlock: Set<number>;
}
export function compileBlock(environment: ICompilationEnvironment, block: Block): void {
  function getSequenceBuilder(): InstructionSequenceBuilder {
    return environment.sequenceBuilderStack[environment.sequenceBuilderStack.length - 1];
  }
  function getStack(): Variable[] {
    return environment.stack[environment.stack.length - 1];
  }
  function clearStack(instructionIndex: number) {
    const stack = getStack();
    for (let i = stack.length - 1; i >= 0; i--) {
      clearTos(instructionIndex);
    }
  }
  function bucketOf(variable: Variable): number {
    return environment.bucketIndexArray[variable];
  }
  function clearTos(instructionIndex: number) {
    const usageSpanMapping = environment.mapping;
    const sequenceBuilder = getSequenceBuilder();
    const stack = getStack();
    const variable = stack.pop();
    if (variable === undefined) {
      return;
    }
    const type = environment.variableTypeArray[variable];
    const wasmType = mapIRTypeToWasm(environment.compilationUnit, type);
    const typeMapping = environment.mapping.get(wasmType);
    if (typeMapping === undefined) {
      return;
    }
    const bucketInformation = typeMapping.find((a) => {
      return a.variables.indexOf(variable) !== -1;
    });
    if (bucketInformation === undefined) {
      return;
    }
    if (bucketInformation.total[1] > instructionIndex - 1) {
      sequenceBuilder.localSet(bucketInformation.index);
      environment.bucketsWrittenToInCurrentBasicBlock.delete(bucketInformation.index);
    } else {
      sequenceBuilder.drop();
    }
  }
  function prepareVariableUsage(amount: number) {
    const stack = getStack();
    const builder = getSequenceBuilder();
    const statementIndex = environment.statementIndex;
    let stackVariablesToBeSaved = 0;
    if (stack.length < amount) {
      throw new Error();
    }
    let j = 0;
    while (j < amount) {
      const variable = stack[stack.length - j - 1];
      const bucketIndex = bucketOf(variable);
      if (environment.bucketsWrittenToInCurrentBasicBlock.has(bucketIndex)) {
        stackVariablesToBeSaved = j + 1;
      }
      j++;
    }
    for (let i = stack.length - 1; i > stack.length - stackVariablesToBeSaved; i--) {
      const variable = stack[i];
      const bucket = bucketOf(variable);
      builder.localSet(bucket);
      environment.bucketsWrittenToInCurrentBasicBlock.delete(bucket);
    }
    if (stackVariablesToBeSaved > 0) {
      const variable = stack[stack.length - stackVariablesToBeSaved];
      const bucket = bucketOf(variable);
      builder.localTee(bucket);
      environment.bucketsWrittenToInCurrentBasicBlock.delete(bucket);
    }
    for (let i = stack.length - stackVariablesToBeSaved + 1; i < stack.length; i++) {
      const variable = stack[i];
      const bucket = bucketOf(variable);
      builder.localGet(bucket);
    }
    while (j--) {
      stack.pop();
    }
  }
  function prepareStack(top: number[], exact: boolean = false) {
    const stack = getStack();
    const builder = getSequenceBuilder();
    if (exact) {
      let loadingStart = 0;
      while (bucketOf(stack[loadingStart]) === bucketOf(top[loadingStart]) && loadingStart < stack.length) {
        loadingStart++;
      }
      while (stack.length > loadingStart) {
        clearTos(environment.statementIndex);
      }
      // START | NOT FINISHED
      let j = 0;
      let stackVariablesToBeSaved = 0;
      while (j < top.length) {
        const variable = stack[stack.length - j - 1];
        const bucketIndex = bucketOf(variable);
        if (environment.bucketsWrittenToInCurrentBasicBlock.has(bucketIndex)) {
          stackVariablesToBeSaved = j + 1;
        }
        j++;
      }
      for (let i = stack.length - 1; i > stack.length - stackVariablesToBeSaved; i--) {
        const variable = stack[i];
        const bucket = bucketOf(variable);
        builder.localSet(bucket);
        environment.bucketsWrittenToInCurrentBasicBlock.delete(bucket);
      }
      if (stackVariablesToBeSaved > 0) {
        const variable = stack[stack.length - stackVariablesToBeSaved];
        const bucket = bucketOf(variable);
        builder.localTee(bucket);
        environment.bucketsWrittenToInCurrentBasicBlock.delete(bucket);
      }
      for (let i = stack.length - stackVariablesToBeSaved + 1; i < stack.length; i++) {
        const variable = stack[i];
        const bucket = bucketOf(variable);
        builder.localGet(bucket);
      }
      // END

      for (let i = loadingStart; i < top.length; i++) {
        const variable = top[i];
        const bucketIndex = bucketOf(variable);
        builder.localGet(bucketIndex);

        stack.push(variable);
      }
    } else {
      const firstVariableIndex = stack.map((a) => bucketOf(a)).indexOf(bucketOf(top[0]));
      let loadingStart = -1;
      if (firstVariableIndex === -1) {
        loadingStart = 0;
        for (const v of top) {
          while (stack.map((a) => bucketOf(a)).indexOf(bucketOf(v)) !== -1) {
            clearTos(environment.statementIndex);
          }
        }
      } else {
        let i = 0;
        while ((i + firstVariableIndex) < stack.length && bucketOf(stack[firstVariableIndex + i]) === bucketOf(top[i])) {
          i++;
        }
        loadingStart = i;
        if (i !== stack.length - 1) {
          while (bucketOf(stack[stack.length - 1]) !== bucketOf(top[i - 1])) {
            clearTos(environment.statementIndex);
          }
        }
      }
      // START
      let j = 0;
      let stackVariablesToBeSaved = 0;
      while (j < (top.length - loadingStart) && j < stack.length) {
        const variable = stack[stack.length - j - 1];
        const bucketIndex = bucketOf(variable);
        if (environment.bucketsWrittenToInCurrentBasicBlock.has(bucketIndex)) {
          stackVariablesToBeSaved = j + 1;
        }
        j++;
      }
      for (let i = stack.length - 1; i > stack.length - stackVariablesToBeSaved; i--) {
        const variable = stack[i];
        const bucket = bucketOf(variable);
        builder.localSet(bucket);
        environment.bucketsWrittenToInCurrentBasicBlock.delete(bucket);
      }
      if (stackVariablesToBeSaved > 0) {
        const variable = stack[stack.length - stackVariablesToBeSaved];
        const bucket = bucketOf(variable);
        builder.localTee(bucket);
        environment.bucketsWrittenToInCurrentBasicBlock.delete(bucket);
      }
      for (let i = stack.length - stackVariablesToBeSaved + 1; i < stack.length; i++) {
        const variable = stack[i];
        const bucket = bucketOf(variable);
        builder.localGet(bucket);
      }

      // END

      for (let i = loadingStart; i < top.length; i++) {
        const variable = top[i];
        const type = environment.variableTypeArray[variable];
        const wasmType = mapIRTypeToWasm(environment.compilationUnit, type);
        const typeMapping = environment.mapping.get(wasmType);
        if (typeMapping === undefined) {
          throw new Error();
        }
        const bucketInformation = typeMapping.find((a) => {
          return a.variables.indexOf(variable) !== -1;
        });
        if (bucketInformation === undefined) {
          throw new Error();
        }
        builder.localGet(bucketInformation.index);

        stack.push(variable);
      }
    }
    let a = 0;
    while (a < top.length) {
      stack.pop();
      a++;
    }
  }
  if (block.type === BlockType.basic) {
    const builder = getSequenceBuilder();
    const stack = getStack();
    const localTypeMapping = environment.variableTypeArray;
    const typeOf = (variable: number): Type => {
      return localTypeMapping[variable];
    };
    const convertToWasmType = (type: Type): ValueType => {
      return mapIRTypeToWasm(environment.compilationUnit, type);
    };
    environment.bucketsWrittenToInCurrentBasicBlock = new Set();
    for (const statement of block.statements) {
      if (statement[0] === InstructionType.phi) {
        const [, target, args] = statement;
        // No actual compiled code generates from this.
      }
      if (statement[0] === InstructionType.break) {
        builder.br(1);
      }
      if (statement[0] === InstructionType.breakIf) {
        const [, condition] = statement;
        prepareStack([condition], true);
        builder.brIf(0);
      }
      if (statement[0] === InstructionType.breakIfFalse) {
        const [, condition] = statement;
        const type = typeOf(condition);
        const wasmType = convertToWasmType(type);
        prepareStack([condition], true);
        if (wasmType === ValueType.i32) {
          builder.i32Const(1);
          builder.numeric(Instruction.i32Xor);
        } else if (wasmType === ValueType.i64) {
          builder.i64Const(1);
          builder.numeric(Instruction.i64Xor);
        } else {
          throw new Error("Floats cannot be used as break condition");
        }
        builder.brIf(0);
      }
      if (statement[0] === InstructionType.call) {
        const [, functionIdentifier, targets, args] = statement;
        const index = environment.functionIdentifierIndexMapping.get(functionIdentifier);
        const functionType = environment.functionIdentifierTypeMapping.get(functionIdentifier);
        if (index === undefined) {
          throw new Error("Function not found");
        }
        if (functionType === undefined) {
          throw new Error("Function type could not be determined");
        }
        if (args.length !== functionType[0].length) {
          throw new Error();
        }
        if (targets.length !== functionType[1].length) {
          throw new Error();
        }
        // Additional typechecks
        prepareStack(args);
        builder.call(index);

        if (functionType[1].length === 1) {
          stack.push(targets[0]);
        } else {
          // not yet implemented
        }
      }
      if (statement[0] === InstructionType.callFunctionPointer) {
        const [, functionType, functionPointer, targets, args] = statement;
      }
      if (statement[0] === InstructionType.setToConstant) {
        const [, target, constant] = statement;
        const type = environment.variableTypeArray[target];
        const wasmType = mapIRTypeToWasm(environment.compilationUnit, type);
        if (wasmType === ValueType.i32) {
          builder.i32Const(constant);
        }
        if (wasmType === ValueType.i64) {
          builder.i64Const(constant);
        }
        if (wasmType === ValueType.f32) {
          builder.f32Const(constant);
        }
        if (wasmType === ValueType.i64) {
          builder.f64Const(constant);
        }
        stack.push(target);
      }
      if (statement[0] === InstructionType.setToFunction) {
        const [, target, functionidentifier] = statement;
      }
      if (statement[0] === InstructionType.setToGlobal) {
        const [, target, globalIdentifier] = statement;
      }
      if (statement[0] === InstructionType.copy) {
        const [, target, arg] = statement;
      }
      if (statement[0] === InstructionType.load) {
        const [, target, position, type] = statement;
      }
      if (statement[0] === InstructionType.store) {
        const [, value, position, type] = statement;
      }
      if (statement[0] === InstructionType.convert) {
        const [, target, arg, targetType] = statement;
      }
      if (statement[0] === InstructionType.equalToZero) {
        const [, target, arg] = statement;
      }
      if (statement[0] === InstructionType.equal) {
        const [, target, lhs, rhs] = statement;
      }
      if (statement[0] === InstructionType.notEqual) {
        const [, target, lhs, rhs] = statement;
      }
      if (statement[0] === InstructionType.less) {
        const [, target, lhs, rhs] = statement;
        const lhsType = typeOf(lhs);
        const rhsType = typeOf(rhs);
        if (lhsType !== rhsType) {
          throw new Error();
        }
        const type = lhsType;
        const wasmType = convertToWasmType(type);
        const f = isFloat(environment.compilationUnit, type);
        prepareStack([lhs, rhs]);
        if (f) {
          if (wasmType === ValueType.f32) {
            builder.numeric(Instruction.f32Less);
          } else {
            builder.numeric(Instruction.f64Less);
          }
        } else {
          const s = isSigned(environment.compilationUnit, type);
          if (s) {
            if (wasmType === ValueType.i32) {
              builder.numeric(Instruction.i32SignedLess);
            } else {
              builder.numeric(Instruction.i32UnsignedLess);
            }
          } else {
            if (wasmType === ValueType.i32) {
              builder.numeric(Instruction.i64SignedLess);
            } else {
              builder.numeric(Instruction.i64UnsignedLess);
            }
          }
        }
        stack.push(target);
      }
      if (statement[0] === InstructionType.greater) {
        const [, target, lhs, rhs] = statement;
      }
      if (statement[0] === InstructionType.lessEqual) {
        const [, target, lhs, rhs] = statement;
      }
      if (statement[0] === InstructionType.greaterEqual) {
        const [, target, lhs, rhs] = statement;
      }
      if (statement[0] === InstructionType.countLeadingZeroes) {
        const [, target, arg] = statement;
      }
      if (statement[0] === InstructionType.countTrailingZeroes) {
        const [, target, arg] = statement;
      }
      if (statement[0] === InstructionType.add) {
        const [, target, lhs, rhs] = statement;
        const lhsType = typeOf(lhs);
        const rhsType = typeOf(rhs);
        if (lhsType !== rhsType) {
          throw new Error();
        }
        const type = lhsType;
        const wasmType = convertToWasmType(type);
        const f = isFloat(environment.compilationUnit, type);
        prepareStack([lhs, rhs]);
        if (f) {
          if (wasmType === ValueType.f32) {
            builder.numeric(Instruction.f32Add);
          } else {
            builder.numeric(Instruction.f64Load);
          }
        } else {
          if (wasmType === ValueType.i32) {
            builder.numeric(Instruction.i32Add);
          } else {
            builder.numeric(Instruction.i64Add);
          }
        }
        stack.push(target);
      }
      if (statement[0] === InstructionType.subtract) {
        const [, target, lhs, rhs] = statement;
      }
      if (statement[0] === InstructionType.multiply) {
        const [, target, lhs, rhs] = statement;
      }
      if (statement[0] === InstructionType.divide) {
        const [, target, lhs, rhs] = statement;
      }
      if (statement[0] === InstructionType.remainder) {
        const [, target, lhs, rhs] = statement;
      }
      if (statement[0] === InstructionType.and) {
        const [, target, lhs, rhs] = statement;
      }
      if (statement[0] === InstructionType.or) {
        const [, target, lhs, rhs] = statement;
      }
      if (statement[0] === InstructionType.xor) {
        const [, target, lhs, rhs] = statement;
      }
      if (statement[0] === InstructionType.shiftLeft) {
        const [, target, arg] = statement;
      }
      if (statement[0] === InstructionType.shiftRight) {
        const [, target, arg] = statement;
      }
      if (statement[0] === InstructionType.rotateleft) {
        const [, target, arg] = statement;
      }
      if (statement[0] === InstructionType.rotateRight) {
        const [, target, arg] = statement;
      }
      if (statement[0] === InstructionType.absolute) {
        const [, target, arg] = statement;
      }
      if (statement[0] === InstructionType.negate) {
        const [, target, arg] = statement;
      }
      if (statement[0] === InstructionType.floor) {
        const [, target, arg] = statement;
      }
      if (statement[0] === InstructionType.truncate) {
        const [, target, arg] = statement;
      }
      if (statement[0] === InstructionType.nearest) {
        const [, target, arg] = statement;
      }
      if (statement[0] === InstructionType.sqrt) {
        const [, target, arg] = statement;
      }
      if (statement[0] === InstructionType.minimum) {
        const [, target, lhs, rhs] = statement;
      }
      if (statement[0] === InstructionType.maximum) {
        const [, target, lhs, rhs] = statement;
      }
      if (!isPhiNode(statement)) {
        const writtenVars = getWrittenVariables(statement);
        for (const v of writtenVars) {
          const bucket = bucketOf(v);
          environment.bucketsWrittenToInCurrentBasicBlock.add(bucket);
        }
      }
      environment.statementIndex++;
    }
  } else if (block.type === BlockType.breakble) {
    clearStack(environment.statementIndex);
    environment.sequenceBuilderStack.push(new InstructionSequenceBuilder());
    environment.stack.push([]);
    for (const b of block.blocks) {
      compileBlock(environment, b);
    }
    clearStack(environment.statementIndex);
    const builder = environment.sequenceBuilderStack.pop();
    const stack = environment.stack.pop();
    if (builder === undefined) {
      throw new Error();
    }
    if (stack === undefined) {
      throw new Error();
    }
    const parentBuilder = getSequenceBuilder();
    parentBuilder.block(NonValueResultType.empty, builder);
  } else if (block.type === BlockType.loop) {
    clearStack(environment.statementIndex);
    environment.sequenceBuilderStack.push(new InstructionSequenceBuilder());
    environment.stack.push([]);
    for (const b of block.blocks) {
      compileBlock(environment, b);
    }
    clearStack(environment.statementIndex);
    const builder = environment.sequenceBuilderStack.pop();
    const stack = environment.stack.pop();
    if (builder === undefined) {
      throw new Error();
    }
    if (stack === undefined) {
      throw new Error();
    }
    const parentBuilder = getSequenceBuilder();
    parentBuilder.loop(NonValueResultType.empty, builder);
  }
}
