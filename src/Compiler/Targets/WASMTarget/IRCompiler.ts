import { Block, BlockType, FunctionIdentifier, FunctionType, ICompilationUnit, InstructionType, MemoryIRType, SignedUnsignedWASMType, Type, Variable } from "../../IR/AST";
import { getAllPhiNodes, getReadVariables, getStatementsInLinearOrder, getWrittenVariables, isBreakStatement, isFloat, isPhiNode, isSigned, mapIRTypeToSignedUnsignedWASMType, mapIRTypeToWasm } from "./Utils";
import { IExport, ILimit, ILocal, IMemoryExport, IModule } from "./WASM/AST";
import { ASTBuilder } from "./WASM/ASTBuilder";
import { ExportDescription, Instruction, Limit, NonValueResultType, TableType, ValueType } from "./WASM/Encoding/Constants";
import { InstructionSequenceBuilder } from "./WASM/Encoding/InstructionSequenceBuilder";

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

  const functionIdentifierTableIndexMapping: Map<FunctionIdentifier, number> = new Map();
  i = 0;
  const tableFunctionIdentifierArray: FunctionIdentifier[] = [];
  for (const externalFunctionDeclaration of ir.externalFunctionDeclarations) {
    if (externalFunctionDeclaration.tableElement) {
      functionIdentifierTableIndexMapping.set(externalFunctionDeclaration.identifier, i);
      i++;
      tableFunctionIdentifierArray.push(externalFunctionDeclaration.identifier);
    }
  }
  for (const internalFunctionDeclaration of ir.internalFunctionDeclarations) {
    if (internalFunctionDeclaration.tableElement) {
      functionIdentifierTableIndexMapping.set(internalFunctionDeclaration.identifier, i);
      i++;
      tableFunctionIdentifierArray.push(internalFunctionDeclaration.identifier);
    }
  }

  const functionIdentifierTypeMapping: Map<FunctionIdentifier, FunctionType> = new Map();
  for (const internalFunctionDeclaration of ir.internalFunctionDeclarations) {
    functionIdentifierTypeMapping.set(internalFunctionDeclaration.identifier, internalFunctionDeclaration.type);
  }
  for (const externalFunctionDeclaration of ir.externalFunctionDeclarations) {
    functionIdentifierTypeMapping.set(externalFunctionDeclaration.identifier, externalFunctionDeclaration.type);
  }

  const wasmBuilder = new ASTBuilder();
  wasmBuilder.addTypeSection();
  for (const externalFunctionDeclaration of ir.externalFunctionDeclarations) {
    const type = externalFunctionDeclaration.type;
    const argTypeBuffer: ValueType[] = [];
    for (const argType of type[0]) {
      argTypeBuffer.push(mapIRTypeToWasm(ir, argType));
    }
    const resultType = type[1].length >= 1 ? mapIRTypeToWasm(ir, type[1][0]) : undefined;
    const index = wasmBuilder.functionTypeIndex(argTypeBuffer, resultType);
    wasmBuilder.addFunctionImport("env", externalFunctionDeclaration.externalName, index);
  }

  wasmBuilder.addFunctionSection();

  wasmBuilder.addTableSection([{
    elementType: TableType.funcref,
    limits: {
      kind: Limit.minimumAndMaximum,
      min: 10,
      max: 10,
    },
  }]);

  const memory: ILimit = {
    kind: Limit.minimumAndMaximum,
    min: 1,
    max: 1,
  };
  wasmBuilder.addMemorySection([memory]);

  const dataSegmentOffsetArray: number[] = [];

  let currentOffset = 0;
  const alignment = 16;

  for (const segmentData of ir.dataSegments) {
    dataSegmentOffsetArray.push(currentOffset);
    const content = segmentData.content;
    const length = content.length;
    currentOffset += length;
    currentOffset = (Math.ceil(currentOffset / alignment)) * alignment;
  }
  currentOffset = (Math.ceil(currentOffset / alignment)) * alignment;

  const i32ReturnOffset: number[] = [];
  const i64ReturnOffset: number[] = [];
  const f32ReturnOffset: number[] = [];
  const f64ReturnOffset: number[] = [];
  function ensure(type: ValueType, index: number) {
    if (type === ValueType.i32) {
      while (i32ReturnOffset.length <= index) {
        i32ReturnOffset.push(currentOffset);
        currentOffset += 4;
      }
    } else if (type === ValueType.i64) {
      while (i64ReturnOffset.length <= index) {
        i64ReturnOffset.push(currentOffset);
        currentOffset += 8;
      }
    } else if (type === ValueType.f32) {
      while (f32ReturnOffset.length <= index) {
        f32ReturnOffset.push(currentOffset);
        currentOffset += 4;
      }
    } else if (type === ValueType.f64) {
      while (f64ReturnOffset.length <= index) {
        f64ReturnOffset.push(currentOffset);
        currentOffset += 8;
      }
    }
  }
  currentOffset = (Math.ceil(currentOffset / alignment)) * alignment;
  for (const internalFunctionDeclaration of ir.internalFunctionDeclarations) {
    const functionType = internalFunctionDeclaration.type[1].slice(1);
    let i32 = 0;
    let i64 = 0;
    let f32 = 0;
    let f64 = 0;
    for (const t of functionType) {
      const wasmType = mapIRTypeToWasm(ir, t);
      if (wasmType === ValueType.i32) {
        ensure(wasmType, i32);
        i32++;
      } else if (wasmType === ValueType.i64) {
        ensure(wasmType, i64);
        i64++;
      } else if (wasmType === ValueType.f32) {
        ensure(wasmType, f32);
        f32++;
      } else if (wasmType === ValueType.f64) {
        ensure(wasmType, f64);
        f64++;
      }
    }
  }
  currentOffset += 64;
  for (const externalFunctionDeclaration of ir.externalFunctionDeclarations) {
    const functionType = externalFunctionDeclaration.type[1].slice(1);
    let i32 = 0;
    let i64 = 0;
    let f32 = 0;
    let f64 = 0;
    for (const t of functionType) {
      const wasmType = mapIRTypeToWasm(ir, t);
      if (wasmType === ValueType.i32) {
        ensure(wasmType, i32);
        i32++;
      } else if (wasmType === ValueType.i64) {
        ensure(wasmType, i64);
        i64++;
      } else if (wasmType === ValueType.f32) {
        ensure(wasmType, f32);
        f32++;
      } else if (wasmType === ValueType.f64) {
        ensure(wasmType, f64);
        f64++;
      }
    }
  }

  wasmBuilder.addExportSection();
  const elementSection = wasmBuilder.addElementSection();
  wasmBuilder.addCodeSection();

  for (const fn of ir.functionCode) {
    const functionType = functionIdentifierTypeMapping.get(fn.identifier);
    const localTypes = fn.variableTypes;
    if (functionType === undefined) {
      throw new Error();
    }

    const argTypeBuffer: ValueType[] = [];
    for (const argType of functionType[0]) {
      argTypeBuffer.push(mapIRTypeToWasm(ir, argType));
    }
    const resultType = functionType[1].length >= 1 ? mapIRTypeToWasm(ir, functionType[1][0]) : undefined;
    const index = wasmBuilder.functionTypeIndex(argTypeBuffer, resultType);

    const irTypes = functionType[0].concat(localTypes);

    const variableTypeArray = functionType[0].map((type) => mapIRTypeToWasm(ir, type));
    const variablePhiNodeLocalMapping: Map<number, number[]> = new Map();
    const phiNodeResultLocalMapping: Map<number, number> = new Map();
    const phiNodes: Array<[Variable, Variable[]]> = [];
    getAllPhiNodes(phiNodes, fn.code);
    for (const node of phiNodes) {
      const newIndex = variableTypeArray.length;
      const [written, read] = node;
      const writtenIRType = irTypes[written];
      const writtenType = mapIRTypeToWasm(ir, writtenIRType);
      variableTypeArray.push(writtenType);
      phiNodeResultLocalMapping.set(written, newIndex);
      for (const readVariable of read) {
        const mapping = variablePhiNodeLocalMapping.get(readVariable);
        if (mapping === undefined) {
          variablePhiNodeLocalMapping.set(readVariable, [newIndex]);
        } else {
          mapping.push(newIndex);
        }
      }
    }

    const variableLastUsageStatementIndex: Map<number, number> = new Map();
    let w = 0;
    for (const statement of getStatementsInLinearOrder(fn.code)) {
      if (!isPhiNode(statement)) {
        const read = getReadVariables(statement);
        for (const variable of read) {
          variableLastUsageStatementIndex.set(variable, w);
        }
      }
      w++;
    }

    const localSavedVariableMap = new Map();
    const variableSavedInLocalMap = new Map();
    let argId = 0;
    while (argId < variableTypeArray.length) {
      localSavedVariableMap.set(argId, argId);
      variableSavedInLocalMap.set(argId, argId);
      argId++;
    }
    const env: ICompilationEnvironment = {
      compilationUnit: ir,
      functionType,
      functionIdentifierTypeMapping,
      functionIdentifierIndexMapping,
      functionIdentifierTableIndexMapping,
      irVariableTypeArray: irTypes,
      wasmVariableTypeArray: variableTypeArray,
      dataSegmentOffsetArray,

      variableLastUsageStatementIndex,

      sequenceBuilderStack: [],
      statementIndex: 0,

      stackArray: [],
      reproducibleVariableMapping: new Map(),
      localSavedVariableMap,
      variableSavedInLocalMap,
      variablePhiNodeLocalMapping,
      phiNodeResultLocalMapping,

      variablesWrittenToInCurrentBlock: new Set(),

      i32ReturnOffset,
      i64ReturnOffset,
      f32ReturnOffset,
      f64ReturnOffset,
      heapStart: currentOffset,

      wasmBuilder,
    };
    const instructionBuilder = new InstructionSequenceBuilder();
    env.sequenceBuilderStack.push(instructionBuilder);
    env.stackArray.push([]);

    for (const block of fn.code) {
      compileBlock(env, block);
    }
    if (process.argv.includes("--print-wasm")) {
      console.log("<", fn.identifier, ">");
      console.log("#", functionIdentifierIndexMapping.get(fn.identifier));
      const defaultTypeSection = wasmBuilder.defaultTypeSection;
      if (defaultTypeSection) {
        console.log(defaultTypeSection.types[index]);
      }
      console.log(instructionBuilder.debugInstructions.join("\n"));
      console.log();
    }

    const sequenceBuilder = env.sequenceBuilderStack[env.sequenceBuilderStack.length - 1];
    const locals: ILocal[] = [];
    for (const type of variableTypeArray) {
      locals.push({
        n: 1,
        type,
      });
    }
    const stack = env.stackArray[env.stackArray.length - 1];
    for (let j = stack.length - 1; j >= 0; j--) {
      sequenceBuilder.drop();
    }
    sequenceBuilder.end();
    const wasmFunctionIndex = functionIdentifierIndexMapping.get(fn.identifier);
    if (wasmFunctionIndex === undefined) {
      throw new Error();
    }
    wasmBuilder.addFunction(wasmFunctionIndex, fn.identifier, index, locals, sequenceBuilder.instructions);
  }
  const memoryExportDescription: IMemoryExport = {
    type: ExportDescription.memory,
    index: 0,
  };
  const memoryExport: IExport = {
    name: "memory",
    description: memoryExportDescription,
  };

  const exportSection = wasmBuilder.defaultExportSection || wasmBuilder.addExportSection();
  exportSection.exports.push(memoryExport);

  const offsetSequenceBuilder = new InstructionSequenceBuilder();
  offsetSequenceBuilder.i32Const(0);
  offsetSequenceBuilder.end();
  const initArray: number[] = [];
  for (const identifier of tableFunctionIdentifierArray) {
    const index = functionIdentifierIndexMapping.get(identifier);
    if (index === undefined) {
      throw new Error();
    }
    initArray.push(index);
  }
  const offset = offsetSequenceBuilder.instructions;
  elementSection.elements.push({
    table: 0,
    offset,
    init: initArray,
  });

  let k = 0;
  const dataSection = wasmBuilder.addDataSection();
  for (const segmentData of ir.dataSegments) {
    const dataOffset = dataSegmentOffsetArray[k];
    const content = segmentData.content;

    const constantOffsetInstructionBuilder = new InstructionSequenceBuilder();
    constantOffsetInstructionBuilder.i32Const(dataOffset);
    constantOffsetInstructionBuilder.end();
    dataSection.segments.push({
      memIndex: 0,
      offset: constantOffsetInstructionBuilder.instructions,
      data: content,
    });
    k++;
  }

  return wasmBuilder.module;
}
export class ReproducibleVariable {
  public index: number;
  public sequenceBuilder: InstructionSequenceBuilder;
  constructor(index: number, sequenceBuilder: InstructionSequenceBuilder) {
    this.index = index;
    this.sequenceBuilder = sequenceBuilder;
  }
}
export interface ICompilationEnvironment {
  compilationUnit: ICompilationUnit;
  functionType: FunctionType;
  functionIdentifierTypeMapping: Map<FunctionIdentifier, FunctionType>;
  functionIdentifierIndexMapping: Map<FunctionIdentifier, number>;
  functionIdentifierTableIndexMapping: Map<FunctionIdentifier, number>;
  irVariableTypeArray: Type[];
  wasmVariableTypeArray: ValueType[];
  dataSegmentOffsetArray: number[];
  variableLastUsageStatementIndex: Map<number, number>;

  sequenceBuilderStack: InstructionSequenceBuilder[];
  statementIndex: number;

  stackArray: Variable[][];
  reproducibleVariableMapping: Map<number, ReproducibleVariable>;
  localSavedVariableMap: Map<number, number>;
  variableSavedInLocalMap: Map<number, number>;
  variablePhiNodeLocalMapping: Map<number, number[]>;
  phiNodeResultLocalMapping: Map<number, number>;

  variablesWrittenToInCurrentBlock: Set<number>;

  i32ReturnOffset: number[];
  i64ReturnOffset: number[];
  f32ReturnOffset: number[];
  f64ReturnOffset: number[];

  heapStart: number;

  wasmBuilder: ASTBuilder;

}
export function compileBlock(environment: ICompilationEnvironment, block: Block): void {
  function geti32ReturnOffset(index: number): number {
    return environment.i32ReturnOffset[index];
  }
  function geti64ReturnOffset(index: number): number {
    return environment.i64ReturnOffset[index];
  }
  function getf32ReturnOffset(index: number): number {
    return environment.f32ReturnOffset[index];
  }
  function getf64ReturnOffset(index: number): number {
    return environment.f64ReturnOffset[index];
  }
  function getSequenceBuilder(): InstructionSequenceBuilder {
    return environment.sequenceBuilderStack[environment.sequenceBuilderStack.length - 1];
  }
  function getStack(): Variable[] {
    return environment.stackArray[environment.stackArray.length - 1];
  }
  function clearStack() {
    const stack = getStack();
    for (let i = stack.length - 1; i >= 0; i--) {
      clearTos();
    }
  }
  function clearTos() {
    const stack = getStack();
    const tosVariable = stack[stack.length - 1];
    const sequenceBuilder = getSequenceBuilder();

    const usage = environment.variableLastUsageStatementIndex.get(tosVariable);
    if (usage !== undefined) {
      if (usage < environment.statementIndex) {
        const variablePhiNodeLocalMapping = environment.variablePhiNodeLocalMapping.get(tosVariable);
        if (variablePhiNodeLocalMapping !== undefined && variablePhiNodeLocalMapping.length > 0) {
          for (let i = 0; i < variablePhiNodeLocalMapping.length; i++) {
            sequenceBuilder.localSet(variablePhiNodeLocalMapping[i]);
          }
          environment.variablesWrittenToInCurrentBlock.delete(tosVariable);
          stack.pop();
          return;
        }
      }
    }

    const index = environment.wasmVariableTypeArray.length;
    const type = environment.irVariableTypeArray[tosVariable];
    const wasmType = mapIRTypeToWasm(environment.compilationUnit, type);
    environment.wasmVariableTypeArray.push(wasmType);
    sequenceBuilder.localSet(index);

    environment.variableSavedInLocalMap.set(tosVariable, index);
    environment.localSavedVariableMap.set(index, tosVariable);

    stack.pop();
  }
  function teeTos() {
    const stack = getStack();
    const tosVariable = stack[stack.length - 1];
    const sequenceBuilder = getSequenceBuilder();

    const usage = environment.variableLastUsageStatementIndex.get(tosVariable);
    if (usage !== undefined) {
      if (usage < environment.statementIndex) {
        const variablePhiNodeLocalMapping = environment.variablePhiNodeLocalMapping.get(tosVariable);
        if (variablePhiNodeLocalMapping !== undefined && variablePhiNodeLocalMapping.length > 0) {
          for (let i = 0; i < variablePhiNodeLocalMapping.length; i++) {
            sequenceBuilder.localSet(variablePhiNodeLocalMapping[i]);
          }
          environment.variablesWrittenToInCurrentBlock.delete(tosVariable);
          stack.pop();
          return;
        }
      }
    }

    const index = environment.wasmVariableTypeArray.length;
    const type = environment.irVariableTypeArray[tosVariable];
    const wasmType = mapIRTypeToWasm(environment.compilationUnit, type);
    environment.wasmVariableTypeArray.push(wasmType);
    sequenceBuilder.localTee(index);

    environment.variableSavedInLocalMap.set(tosVariable, index);
    environment.localSavedVariableMap.set(index, tosVariable);
  }
  function load(variable: number) {
    const sequenceBuilder = getSequenceBuilder();
    const reproducible = environment.reproducibleVariableMapping.get(variable);
    if (reproducible !== undefined) {
      sequenceBuilder.write(reproducible.sequenceBuilder);
      return;
    }
    const local = environment.variableSavedInLocalMap.get(variable);
    if (local !== undefined) {
      sequenceBuilder.localGet(local);
      return;
    }
    throw new Error();
  }
  function loadReturnValueOnStack(functionResultTypes: Type[]) {
    const sequenceBuilder = getSequenceBuilder();
    const resultVariablesThatHaveToBeLoaded = functionResultTypes.slice(1);
    let i32Index = 0;
    let i64Index = 0;
    let f32Index = 0;
    let f64Index = 0;
    for (const type of resultVariablesThatHaveToBeLoaded) {
      const valueType = mapIRTypeToWasm(environment.compilationUnit, type);
      let offset = -1;
      sequenceBuilder.i32Const(0);
      if (valueType === ValueType.i32) {
        offset = geti32ReturnOffset(i32Index);
        i32Index++;
        sequenceBuilder.load(Instruction.i32Load, { align: 0, offset });
      } else if (valueType === ValueType.i64) {
        offset = geti64ReturnOffset(i64Index);
        i64Index++;
        sequenceBuilder.load(Instruction.i64Load, { align: 0, offset });
      } else if (valueType === ValueType.f32) {
        offset = getf32ReturnOffset(f32Index);
        f32Index++;
        sequenceBuilder.load(Instruction.f32Load, { align: 0, offset });
      } else if (valueType === ValueType.f64) {
        offset = getf64ReturnOffset(f64Index);
        f64Index++;
        sequenceBuilder.load(Instruction.f64Load, { align: 0, offset });
      }
    }
  }
  function prepareStack(top: number[], exact: boolean = false) {
    const stack = getStack();
    let stackIndexOfLowestNonReproducibleVariableOfTop = Infinity;
    let tosIndexOfLowestNonReproducibleVariableOfTop = Infinity;
    for (let i = 0; i < top.length; i++) {
      const variable = top[i];
      const indexOnStack = stack.indexOf(variable);
      if (indexOnStack === -1) {
        continue;
      }
      const isReproducible = environment.reproducibleVariableMapping.has(variable);
      if (isReproducible) {
        continue;
      }
      const isLocalSaved = environment.variableSavedInLocalMap.has(variable);
      if (isLocalSaved) {
        continue;
      }
      if (indexOnStack < stackIndexOfLowestNonReproducibleVariableOfTop) {
        stackIndexOfLowestNonReproducibleVariableOfTop = indexOnStack;
        tosIndexOfLowestNonReproducibleVariableOfTop = i;
      }
    }
    if (exact) {
      if (tosIndexOfLowestNonReproducibleVariableOfTop === 0 && stackIndexOfLowestNonReproducibleVariableOfTop === 0) {
        let loadedTopVariables: number = 0;
        for (loadedTopVariables = 0; loadedTopVariables < top.length && loadedTopVariables < stack.length; loadedTopVariables++) {
          if (stack[loadedTopVariables] !== top[loadedTopVariables]) {
            break;
          }
        }
        const stackVariablesToBeDeleted = Math.max(0, stack.length - loadedTopVariables);
        const topVariablesToBeLoaded = Math.max(0, top.length - loadedTopVariables);
        for (let i = 0; i < stackVariablesToBeDeleted; i++) {
          clearTos();
        }
        for (let i = 0; i < topVariablesToBeLoaded; i++) {
          const variable = top[loadedTopVariables + i];
          load(variable);
        }
        while (stack.length > 0) {
          stack.pop();
        }
      } else {
        clearStack();
        for (let i = 0; i < top.length; i++) {
          const variable = top[i];
          load(variable);
        }
      }
    } else {
      if (stackIndexOfLowestNonReproducibleVariableOfTop === Infinity) {
        let perfect = true;
        const firstStackIndex = stack.indexOf(top[0]);
        if (firstStackIndex !== stack.length - top.length) {
          perfect = false;
        }
        if (perfect) {
          for (let i = 0; i < top.length; i++) {
            if (stack[firstStackIndex + i] !== top[i]) {
              perfect = false;
              break;
            }
          }
        }
        if (perfect) {
          // are all reproducible - we can destroy them without saving them
          for (let i = 0; i < stack.length; i++) {
            stack.pop();
          }
        } else {
          for (const variable of top) {
            load(variable);
          }
        }
      } else {
        if (tosIndexOfLowestNonReproducibleVariableOfTop === 0) {
          const stackStartIndex = stackIndexOfLowestNonReproducibleVariableOfTop;
          for (let i = stack.length - 1; i > stackStartIndex + 1; i--) {
            clearTos();
          }
          teeTos();
          stack.pop();
          for (let i = 1; i < top.length; i++) {
            const variable = top[i];
            load(variable);
          }
        } else {
          const stackStartIndex = stackIndexOfLowestNonReproducibleVariableOfTop;
          for (let i = stack.length - 1; i >= stackStartIndex; i--) {
            clearTos();
          }
          for (let i = 0; i < top.length; i++) {
            const variable = top[i];
            load(variable);
          }
        }
      }
    }
  }
  if (block.type === BlockType.basic) {
    const builder = getSequenceBuilder();
    const stack = getStack();
    const localTypeMapping = environment.irVariableTypeArray;
    const typeOf = (variable: number): Type => {
      return localTypeMapping[variable];
    };
    const convertToWasmType = (type: Type): ValueType => {
      return mapIRTypeToWasm(environment.compilationUnit, type);
    };
    environment.variablesWrittenToInCurrentBlock = new Set();

    function savePhiNodeReadVariables() {
      const handledWrittenVariables: Set<number> = new Set();
      for (let i = stack.length - 1; i >= 0; i--) {
        const variable = stack[i];
        if (!environment.variablesWrittenToInCurrentBlock.has(variable)) {
          clearTos();
          continue;
        }
        const arrayOfLocals = environment.variablePhiNodeLocalMapping.get(variable);
        if (arrayOfLocals === undefined) {
          clearTos();
          continue;
        }
        const savingTo = arrayOfLocals.slice();
        const reproducible = environment.reproducibleVariableMapping.has(variable);
        if (!reproducible) {
          const index = environment.wasmVariableTypeArray.length;
          const type = environment.irVariableTypeArray[variable];
          const wasmType = convertToWasmType(type);
          environment.wasmVariableTypeArray.push(wasmType);
          environment.localSavedVariableMap.set(index, variable);
          environment.variableSavedInLocalMap.set(variable, index);
          savingTo.push(index);
        }
        if (savingTo.length === 0) {
          continue;
        }
        for (let i = 0; i < savingTo.length - 1; i++) {
          builder.localTee(savingTo[i]);
        }
        builder.localSet(savingTo[savingTo.length - 1]);
        stack.pop();
        handledWrittenVariables.add(variable);
      }
      const writtenVariables = environment.variablesWrittenToInCurrentBlock.values();
      for (const variable of writtenVariables) {
        if (handledWrittenVariables.has(variable)) {
          continue;
        }
        const arrayOfLocals = environment.variablePhiNodeLocalMapping.get(variable);
        if (arrayOfLocals === undefined) {
          continue;
        }
        if (arrayOfLocals.length === 0) {
          continue;
        }
        load(variable);
        for (let i = 0; i < arrayOfLocals.length - 1; i++) {
          builder.localTee(arrayOfLocals[i]);
        }
        builder.localSet(arrayOfLocals[arrayOfLocals.length - 1]);
      }
      environment.variablesWrittenToInCurrentBlock = new Set();
    }

    for (const statement of block.statements) {
      if (isBreakStatement(statement)) {
        savePhiNodeReadVariables();
      }

      if (statement[0] === InstructionType.phi) {
        const [, target] = statement;
        const localIndex = environment.phiNodeResultLocalMapping.get(target);
        if (localIndex === undefined) {
          throw new Error();
        }
        environment.localSavedVariableMap.set(localIndex, target);
        environment.variableSavedInLocalMap.set(target, localIndex);
      } else if (statement[0] === InstructionType.break) {
        builder.br(1);
      } else if (statement[0] === InstructionType.breakIf) {
        const [, condition] = statement;
        prepareStack([condition], true);
        builder.brIf(0);
      } else if (statement[0] === InstructionType.breakIfFalse) {
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
      } else if (statement[0] === InstructionType.call) {
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
          loadReturnValueOnStack(functionType[1]);
          stack.push(...targets);
        }
      } else if (statement[0] === InstructionType.callFunctionPointer) {
        const [, functionType, functionPointer, targets, args] = statement;
        if (args.length !== functionType[0].length) {
          throw new Error();
        }
        if (targets.length !== functionType[1].length) {
          throw new Error();
        }
        // Additional typechecks
        const argTypeBuffer: ValueType[] = [];
        for (const argType of functionType[0]) {
          argTypeBuffer.push(convertToWasmType(argType));
        }
        const resultType = functionType[1].length >= 1 ? convertToWasmType(functionType[1][0]) : undefined;
        prepareStack([...args, functionPointer]);
        builder.callIndirect(environment.wasmBuilder.functionTypeIndex(argTypeBuffer, resultType));

        if (functionType[1].length === 1) {
          stack.push(targets[0]);
        } else {
          loadReturnValueOnStack(functionType[1]);
          stack.push(...targets);
        }
      } else if (statement[0] === InstructionType.setToConstant) {
        const [, target, constant] = statement;
        const type = environment.irVariableTypeArray[target];
        const wasmType = mapIRTypeToWasm(environment.compilationUnit, type);
        const instructionSequenceBuilder = new InstructionSequenceBuilder();
        if (wasmType === ValueType.i32) {
          instructionSequenceBuilder.i32Const(constant);
        }
        if (wasmType === ValueType.i64) {
          instructionSequenceBuilder.i64Const(constant);
        }
        if (wasmType === ValueType.f32) {
          instructionSequenceBuilder.f32Const(constant);
        }
        if (wasmType === ValueType.i64) {
          instructionSequenceBuilder.f64Const(constant);
        }
        const v = new ReproducibleVariable(target, instructionSequenceBuilder);
        environment.reproducibleVariableMapping.set(v.index, v);
      } else if (statement[0] === InstructionType.setToFunction) {
        const [, target, functionIdentifier] = statement;
        const constant = environment.functionIdentifierTableIndexMapping.get(functionIdentifier);
        if (constant === undefined) {
          throw new Error();
        }
        const type = environment.irVariableTypeArray[target];
        const instructionSequenceBuilder = new InstructionSequenceBuilder();
        instructionSequenceBuilder.i32Const(constant);
        const v = new ReproducibleVariable(target, instructionSequenceBuilder);
        environment.reproducibleVariableMapping.set(v.index, v);
      } else if (statement[0] === InstructionType.setToGlobal) {
        const [, target, globalIdentifier] = statement;
        if (globalIdentifier === "HEAP_START") {
          const type = Type.ptr;
          const wasmType = mapIRTypeToWasm(environment.compilationUnit, type);
          const instructionSequenceBuilder = new InstructionSequenceBuilder();
          if (wasmType === ValueType.i32) {
            instructionSequenceBuilder.i32Const(environment.heapStart);
          }
          if (wasmType === ValueType.i64) {
            instructionSequenceBuilder.i64Const(environment.heapStart);
          }
          if (wasmType === ValueType.f32) {
            instructionSequenceBuilder.f32Const(environment.heapStart);
          }
          if (wasmType === ValueType.i64) {
            instructionSequenceBuilder.f64Const(environment.heapStart);
          }
          const v = new ReproducibleVariable(target, instructionSequenceBuilder);
          environment.reproducibleVariableMapping.set(v.index, v);
        }
      } else if (statement[0] === InstructionType.setToDataSegment) {
        const [, target, dataSegmentIndex] = statement;
        const type = environment.irVariableTypeArray[target];
        const offset = environment.dataSegmentOffsetArray[dataSegmentIndex];
        const wasmType = mapIRTypeToWasm(environment.compilationUnit, type);
        const instructionSequenceBuilder = new InstructionSequenceBuilder();
        if (wasmType === ValueType.i32) {
          instructionSequenceBuilder.i32Const(offset);
        }
        if (wasmType === ValueType.i64) {
          instructionSequenceBuilder.i64Const(offset);
        }
        if (wasmType === ValueType.f32) {
          instructionSequenceBuilder.f32Const(offset);
        }
        if (wasmType === ValueType.i64) {
          instructionSequenceBuilder.f64Const(offset);
        }
        const v = new ReproducibleVariable(target, instructionSequenceBuilder);
        environment.reproducibleVariableMapping.set(v.index, v);
      } else if (statement[0] === InstructionType.copy) {
        const [, target, arg] = statement;
        prepareStack([arg]);
        stack.push(target);
      } else if (statement[0] === InstructionType.load) {
        const [, target, position, type] = statement;
        const targetType = typeOf(target);
        const wasmValueType = convertToWasmType(targetType);
        prepareStack([position]);
        const memoryArgument = { align: 0, offset: 0 };
        if (wasmValueType === ValueType.i32) {
          if (type === MemoryIRType.si8) {
            builder.load(Instruction.i32LoadS8, memoryArgument);
          }
          if (type === MemoryIRType.ui8) {
            builder.load(Instruction.i32LoadU8, memoryArgument);
          }
          if (type === MemoryIRType.si16) {
            builder.load(Instruction.i32LoadS16, memoryArgument);
          }
          if (type === MemoryIRType.ui16) {
            builder.load(Instruction.i32LoadU16, memoryArgument);
          }
          if (type === MemoryIRType.si32) {
            builder.load(Instruction.i32Load, memoryArgument);
          }
          if (type === MemoryIRType.ui32) {
            builder.load(Instruction.i32Load, memoryArgument);
          }
          if (type === MemoryIRType.ptr) {
            builder.load(Instruction.i32Load, memoryArgument);
          }
          if (type === MemoryIRType.funcptr) {
            builder.load(Instruction.i32Load, memoryArgument);
          }
          if (type === MemoryIRType.si64 || type === MemoryIRType.ui64) {
            builder.load(Instruction.i64Load, memoryArgument);
            // TODO: Check if correct instruction
            builder.numeric(Instruction.i64ExtendI32Signed);
          }
        } else if (wasmValueType === ValueType.i64) {
          if (type === MemoryIRType.si8) {
            builder.load(Instruction.i64LoadS8, memoryArgument);
          }
          if (type === MemoryIRType.ui8) {
            builder.load(Instruction.i64LoadU8, memoryArgument);
          }
          if (type === MemoryIRType.si16) {
            builder.load(Instruction.i64LoadS16, memoryArgument);
          }
          if (type === MemoryIRType.ui16) {
            builder.load(Instruction.i64LoadU16, memoryArgument);
          }
          if (type === MemoryIRType.si32) {
            builder.load(Instruction.i64LoadS32, memoryArgument);
          }
          if (type === MemoryIRType.ui32) {
            builder.load(Instruction.i64LoadU32, memoryArgument);
          }
          if (type === MemoryIRType.si64) {
            builder.load(Instruction.i64Load, memoryArgument);
          }
          if (type === MemoryIRType.ui64) {
            builder.load(Instruction.i64Load, memoryArgument);
          }
          if (type === MemoryIRType.ptr) {
            builder.load(Instruction.i64Load, memoryArgument);
          }
          if (type === MemoryIRType.funcptr) {
            builder.load(Instruction.i64Load, memoryArgument);
          }
        } else if (wasmValueType === ValueType.f32) {
          throw new Error();
        } else if (wasmValueType === ValueType.f64) {
          throw new Error();
        }
        stack.push(target);
      } else if (statement[0] === InstructionType.store) {
        const [, value, position, type] = statement;
        const valueType = typeOf(value);
        const wasmValueType = convertToWasmType(valueType);
        prepareStack([value, position]);
        const memoryArgument = { align: 0, offset: 0 };
        if (wasmValueType === ValueType.i32) {
          if (type === MemoryIRType.si8 || type === MemoryIRType.ui8) {
            builder.store(Instruction.i32Store8, memoryArgument);
          }
          if (type === MemoryIRType.si16 || type === MemoryIRType.ui16) {
            builder.store(Instruction.i32Store16, memoryArgument);
          }
          if (type === MemoryIRType.si32 || type === MemoryIRType.ui32 || type === MemoryIRType.ptr || type === MemoryIRType.funcptr) {
            builder.store(Instruction.i32Store, memoryArgument);
          }
          if (type === MemoryIRType.si64 || type === MemoryIRType.ui64) {
            builder.numeric(Instruction.i32WrapI64);
            builder.store(Instruction.i64Store, memoryArgument);
          }
        } else if (wasmValueType === ValueType.i64) {
          if (type === MemoryIRType.si8 || type === MemoryIRType.ui8) {
            builder.store(Instruction.i64Store8, memoryArgument);
          }
          if (type === MemoryIRType.si16 || type === MemoryIRType.ui16) {
            builder.store(Instruction.i64Store16, memoryArgument);
          }
          if (type === MemoryIRType.si32 || type === MemoryIRType.ui32) {
            builder.store(Instruction.i64Store32, memoryArgument);
          }
          if (type === MemoryIRType.si64 || type === MemoryIRType.ui64 || type === MemoryIRType.ptr || type === MemoryIRType.funcptr) {
            builder.store(Instruction.i64Store, memoryArgument);
          }
        } else if (wasmValueType === ValueType.f32) {
          continue;
        } else if (wasmValueType === ValueType.f64) {
          continue;
        }
      } else if (statement[0] === InstructionType.convert) {
        const [, target, arg, targetIRType] = statement;
        const sourceIRType = typeOf(arg);
        const sourceType = mapIRTypeToSignedUnsignedWASMType(environment.compilationUnit, sourceIRType);
        const targetType = mapIRTypeToSignedUnsignedWASMType(environment.compilationUnit, targetIRType);
        prepareStack([arg]);
        if (sourceType === SignedUnsignedWASMType.ui32) {
          if (targetType === SignedUnsignedWASMType.ui32) {
            // identity
          } else if (targetType === SignedUnsignedWASMType.si32) {
            // identity
          } else if (targetType === SignedUnsignedWASMType.ui64) {
            builder.numeric(Instruction.i64ExtendI32Unsigned);
          } else if (targetType === SignedUnsignedWASMType.si64) {
            builder.numeric(Instruction.i64ExtendI32Unsigned);
          } else if (targetType === SignedUnsignedWASMType.f32) {
            builder.numeric(Instruction.f32ConvertI32Unsigned);
          } else if (targetType === SignedUnsignedWASMType.f64) {
            builder.numeric(Instruction.f64ConvertI32Unsigned);
          }
        } else if (sourceType === SignedUnsignedWASMType.si32) {
          if (targetType === SignedUnsignedWASMType.ui32) {
            // identity
          } else if (targetType === SignedUnsignedWASMType.si32) {
            // identity
          } else if (targetType === SignedUnsignedWASMType.ui64) {
            builder.numeric(Instruction.i64ExtendI32Signed);
          } else if (targetType === SignedUnsignedWASMType.si64) {
            builder.numeric(Instruction.i64ExtendI32Signed);
          } else if (targetType === SignedUnsignedWASMType.f32) {
            builder.numeric(Instruction.f32ConvertI32Signed);
          } else if (targetType === SignedUnsignedWASMType.f64) {
            builder.numeric(Instruction.f64ConvertI32Signed);
          }
        } else if (sourceType === SignedUnsignedWASMType.ui64) {
          if (targetType === SignedUnsignedWASMType.ui32) {
            builder.numeric(Instruction.i32WrapI64);
          } else if (targetType === SignedUnsignedWASMType.si32) {
            builder.numeric(Instruction.i32WrapI64);
          } else if (targetType === SignedUnsignedWASMType.ui64) {
            // identity
          } else if (targetType === SignedUnsignedWASMType.si64) {
            // identity
          } else if (targetType === SignedUnsignedWASMType.f32) {
            builder.numeric(Instruction.f32ConvertI64Unsigned);
          } else if (targetType === SignedUnsignedWASMType.f64) {
            builder.numeric(Instruction.f64ConvertI64Unsigned);
          }
        } else if (sourceType === SignedUnsignedWASMType.si64) {
          if (targetType === SignedUnsignedWASMType.ui32) {
            builder.numeric(Instruction.i32WrapI64);
          } else if (targetType === SignedUnsignedWASMType.si32) {
            builder.numeric(Instruction.i32WrapI64);
          } else if (targetType === SignedUnsignedWASMType.ui64) {
            // identity
          } else if (targetType === SignedUnsignedWASMType.si64) {
            // identity
          } else if (targetType === SignedUnsignedWASMType.f32) {
            builder.numeric(Instruction.f32ConvertI64Signed);
          } else if (targetType === SignedUnsignedWASMType.f64) {
            builder.numeric(Instruction.f64ConvertI64Signed);
          }
        } else if (sourceType === SignedUnsignedWASMType.f32) {
          if (targetType === SignedUnsignedWASMType.ui32) {
            builder.numeric(Instruction.i32TruncateF32Unsigned);
          } else if (targetType === SignedUnsignedWASMType.si32) {
            builder.numeric(Instruction.i32TruncateF32Signed);
          } else if (targetType === SignedUnsignedWASMType.ui64) {
            builder.numeric(Instruction.i64TruncateF32Unsigned);
          } else if (targetType === SignedUnsignedWASMType.si64) {
            builder.numeric(Instruction.i64TruncateF32Signed);
          } else if (targetType === SignedUnsignedWASMType.f32) {
            // identity
          } else if (targetType === SignedUnsignedWASMType.f64) {
            builder.numeric(Instruction.f64PromoteF32);
          }
        } else if (sourceType === SignedUnsignedWASMType.f64) {
          if (targetType === SignedUnsignedWASMType.ui32) {
            builder.numeric(Instruction.i32TruncateF64Unsigned);
          } else if (targetType === SignedUnsignedWASMType.si32) {
            builder.numeric(Instruction.i32TruncateF64Signed);
          } else if (targetType === SignedUnsignedWASMType.ui64) {
            builder.numeric(Instruction.i64TruncateF64Unsigned);
          } else if (targetType === SignedUnsignedWASMType.si64) {
            builder.numeric(Instruction.i64TruncateF64Signed);
          } else if (targetType === SignedUnsignedWASMType.f32) {
            builder.numeric(Instruction.f32DemoteF64);
          } else if (targetType === SignedUnsignedWASMType.f64) {
            // identity
          }
        }
        stack.push(target);
      } else if (statement[0] === InstructionType.equalToZero) {
        const [, target, arg] = statement;
      } else if (statement[0] === InstructionType.equal) {
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
            builder.numeric(Instruction.f32Equal);
          } else {
            builder.numeric(Instruction.f64Equal);
          }
        } else {
          const s = isSigned(environment.compilationUnit, type);
          if (s) {
            if (wasmType === ValueType.i32) {
              builder.numeric(Instruction.i32Equal);
            } else {
              builder.numeric(Instruction.i64Equal);
            }
          } else {
            if (wasmType === ValueType.i32) {
              builder.numeric(Instruction.i32Equal);
            } else {
              builder.numeric(Instruction.i64Equal);
            }
          }
        }
        stack.push(target);
      } else if (statement[0] === InstructionType.notEqual) {
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
            builder.numeric(Instruction.f32NotEqual);
          } else {
            builder.numeric(Instruction.f64NotEqual);
          }
        } else {
          const s = isSigned(environment.compilationUnit, type);
          if (s) {
            if (wasmType === ValueType.i32) {
              builder.numeric(Instruction.i32NotEqual);
            } else {
              builder.numeric(Instruction.i64NotEqual);
            }
          } else {
            if (wasmType === ValueType.i32) {
              builder.numeric(Instruction.i32NotEqual);
            } else {
              builder.numeric(Instruction.i64NotEqual);
            }
          }
        }
        stack.push(target);
      } else if (statement[0] === InstructionType.less) {
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
              builder.numeric(Instruction.i64SignedLess);
            }
          } else {
            if (wasmType === ValueType.i32) {
              builder.numeric(Instruction.i32UnsignedLess);
            } else {
              builder.numeric(Instruction.i64UnsignedLess);
            }
          }
        }
        stack.push(target);
      } else if (statement[0] === InstructionType.greater) {
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
            builder.numeric(Instruction.f32Greater);
          } else {
            builder.numeric(Instruction.f64Greater);
          }
        } else {
          const s = isSigned(environment.compilationUnit, type);
          if (s) {
            if (wasmType === ValueType.i32) {
              builder.numeric(Instruction.i32SignedGreater);
            } else {
              builder.numeric(Instruction.i64SignedGreater);
            }
          } else {
            if (wasmType === ValueType.i32) {
              builder.numeric(Instruction.i32UnsignedGreater);
            } else {
              builder.numeric(Instruction.i64UnsignedGreater);
            }
          }
        }
        stack.push(target);
      } else if (statement[0] === InstructionType.lessEqual) {
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
            builder.numeric(Instruction.f32LessEqual);
          } else {
            builder.numeric(Instruction.f64LessEqual);
          }
        } else {
          const s = isSigned(environment.compilationUnit, type);
          if (s) {
            if (wasmType === ValueType.i32) {
              builder.numeric(Instruction.i32SignedLessEqual);
            } else {
              builder.numeric(Instruction.i64SignedLessEqual);
            }
          } else {
            if (wasmType === ValueType.i32) {
              builder.numeric(Instruction.i32UnsignedLessEqual);
            } else {
              builder.numeric(Instruction.i64UnsignedLessEqual);
            }
          }
        }
        stack.push(target);
      } else if (statement[0] === InstructionType.greaterEqual) {
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
            builder.numeric(Instruction.f32GreaterEqual);
          } else {
            builder.numeric(Instruction.f64GreaterEqual);
          }
        } else {
          const s = isSigned(environment.compilationUnit, type);
          if (s) {
            if (wasmType === ValueType.i32) {
              builder.numeric(Instruction.i32SignedGreaterEqual);
            } else {
              builder.numeric(Instruction.i64SignedGreaterEqual);
            }
          } else {
            if (wasmType === ValueType.i32) {
              builder.numeric(Instruction.i32UnsignedLessEqual);
            } else {
              builder.numeric(Instruction.i64UnsignedLessEqual);
            }
          }
        }
        stack.push(target);
      } else if (statement[0] === InstructionType.countLeadingZeroes) {
        const [, target, arg] = statement;
      } else if (statement[0] === InstructionType.countTrailingZeroes) {
        const [, target, arg] = statement;
      } else if (statement[0] === InstructionType.add) {
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
      } else if (statement[0] === InstructionType.subtract) {
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
            builder.numeric(Instruction.f32Subtract);
          } else {
            builder.numeric(Instruction.f64Subtract);
          }
        } else {
          if (wasmType === ValueType.i32) {
            builder.numeric(Instruction.i32Subtract);
          } else {
            builder.numeric(Instruction.i64Subtract);
          }
        }
        stack.push(target);
      } else if (statement[0] === InstructionType.multiply) {
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
            builder.numeric(Instruction.f32Multiply);
          } else {
            builder.numeric(Instruction.f64Multiply);
          }
        } else {
          if (wasmType === ValueType.i32) {
            builder.numeric(Instruction.i32Multiply);
          } else {
            builder.numeric(Instruction.i64Multiply);
          }
        }
        stack.push(target);
      } else if (statement[0] === InstructionType.divide) {
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
            builder.numeric(Instruction.f32Divide);
          } else {
            builder.numeric(Instruction.f64Divide);
          }
        } else {
          const s = isSigned(environment.compilationUnit, type);
          if (s) {
            if (wasmType === ValueType.i32) {
              builder.numeric(Instruction.i32DivideSigned);
            } else {
              builder.numeric(Instruction.i64DivideSigned);
            }
          } else {
            if (wasmType === ValueType.i32) {
              builder.numeric(Instruction.i32DivideUnsigned);
            } else {
              builder.numeric(Instruction.i64DivideUnsigned);
            }
          }
        }
        stack.push(target);
      } else if (statement[0] === InstructionType.remainder) {
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
          throw new Error("Remainder operation is not defined for floating point operands");
        } else {
          const s = isSigned(environment.compilationUnit, type);
          if (s) {
            if (wasmType === ValueType.i32) {
              builder.numeric(Instruction.i32RemainderSigned);
            } else {
              builder.numeric(Instruction.i64RemainderSigned);
            }
          } else {
            if (wasmType === ValueType.i32) {
              builder.numeric(Instruction.i32RemainderUnsigned);
            } else {
              builder.numeric(Instruction.i64RemainderUnsigned);
            }
          }
        }
        stack.push(target);
      } else if (statement[0] === InstructionType.and) {
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
          throw new Error("And operation is not defined for floating point operands");
        } else {
          if (wasmType === ValueType.i32) {
            builder.numeric(Instruction.i32And);
          } else {
            builder.numeric(Instruction.i64And);
          }
        }
        stack.push(target);
      } else if (statement[0] === InstructionType.or) {
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
          throw new Error("Or operation is not defined for floating point operands");
        } else {
          if (wasmType === ValueType.i32) {
            builder.numeric(Instruction.i32Or);
          } else {
            builder.numeric(Instruction.i64Or);
          }
        }
        stack.push(target);
      } else if (statement[0] === InstructionType.xor) {
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
          throw new Error("Xor operation is not defined for floating point operands");
        } else {
          if (wasmType === ValueType.i32) {
            builder.numeric(Instruction.i32Xor);
          } else {
            builder.numeric(Instruction.i64Xor);
          }
        }
        stack.push(target);
      } else if (statement[0] === InstructionType.shiftLeft) {
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
          throw new Error("Shift operation is not defined for floating point operands");
        } else {
          if (wasmType === ValueType.i32) {
            builder.numeric(Instruction.i32ShiftLeft);
          } else {
            builder.numeric(Instruction.i64ShiftLeft);
          }
        }
        stack.push(target);
      } else if (statement[0] === InstructionType.shiftRight) {
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
          throw new Error("Shift operation is not defined for floating point operands");
        } else {
          const s = isSigned(environment.compilationUnit, type);
          if (s) {
            if (wasmType === ValueType.i32) {
              builder.numeric(Instruction.i32ShiftRightSigned);
            } else {
              builder.numeric(Instruction.i64ShiftRightSigned);
            }
          } else {
            if (wasmType === ValueType.i32) {
              builder.numeric(Instruction.i32ShiftRightUnsigned);
            } else {
              builder.numeric(Instruction.i64ShiftRightUnsigned);
            }
          }
        }
        stack.push(target);
      } else if (statement[0] === InstructionType.rotateleft) {
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
          throw new Error("Rotation operation is not defined for floating point operands");
        } else {
          if (wasmType === ValueType.i32) {
            builder.numeric(Instruction.i32RotateLeft);
          } else {
            builder.numeric(Instruction.i64RotateRight);
          }
        }
        stack.push(target);
      } else if (statement[0] === InstructionType.rotateRight) {
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
          throw new Error("Rotation operation is not defined for floating point operands");
        } else {
          if (wasmType === ValueType.i32) {
            builder.numeric(Instruction.i32RotateRight);
          } else {
            builder.numeric(Instruction.i64RotateRight);
          }
        }
        stack.push(target);
      } else if (statement[0] === InstructionType.absolute) {
        const [, target, arg] = statement;
        const type = typeOf(arg);
        const wasmType = convertToWasmType(type);
        const f = isFloat(environment.compilationUnit, type);
        prepareStack([arg]);
        if (f) {
          if (wasmType === ValueType.f32) {
            builder.numeric(Instruction.f32Absolute);
          } else {
            builder.numeric(Instruction.f64Absolute);
          }
        } else {
          throw new Error("Abs is not defined for integers right now.");
        }
        stack.push(target);
      } else if (statement[0] === InstructionType.negate) {
        const [, target, arg] = statement;
        const type = typeOf(arg);
        const wasmType = convertToWasmType(type);
        const f = isFloat(environment.compilationUnit, type);
        prepareStack([arg]);
        if (f) {
          if (wasmType === ValueType.f32) {
            builder.numeric(Instruction.f32Negate);
          } else {
            builder.numeric(Instruction.f64Negate);
          }
        } else {
          throw new Error("Negate is not defined for integers right now.");
        }
        stack.push(target);
      } else if (statement[0] === InstructionType.floor) {
        const [, target, arg] = statement;
        const type = typeOf(arg);
        const wasmType = convertToWasmType(type);
        const f = isFloat(environment.compilationUnit, type);
        prepareStack([arg]);
        if (f) {
          if (wasmType === ValueType.f32) {
            builder.numeric(Instruction.f32Floor);
          } else {
            builder.numeric(Instruction.f64Floor);
          }
        } else {
          throw new Error("Floor is not defined for integers right now.");
        }
        stack.push(target);
      } else if (statement[0] === InstructionType.truncate) {
        const [, target, arg] = statement;
        const type = typeOf(arg);
        const wasmType = convertToWasmType(type);
        const f = isFloat(environment.compilationUnit, type);
        prepareStack([arg]);
        if (f) {
          if (wasmType === ValueType.f32) {
            builder.numeric(Instruction.f32Truncate);
          } else {
            builder.numeric(Instruction.f64Truncate);
          }
        } else {
          throw new Error("Truncate is not defined for integers right now.");
        }
        stack.push(target);
      } else if (statement[0] === InstructionType.nearest) {
        const [, target, arg] = statement;
        const type = typeOf(arg);
        const wasmType = convertToWasmType(type);
        const f = isFloat(environment.compilationUnit, type);
        prepareStack([arg]);
        if (f) {
          if (wasmType === ValueType.f32) {
            builder.numeric(Instruction.f32Nearest);
          } else {
            builder.numeric(Instruction.f64Nearest);
          }
        } else {
          throw new Error("Nearest is not defined for integers right now.");
        }
        stack.push(target);
      } else if (statement[0] === InstructionType.sqrt) {
        const [, target, arg] = statement;
        const type = typeOf(arg);
        const wasmType = convertToWasmType(type);
        const f = isFloat(environment.compilationUnit, type);
        prepareStack([arg]);
        if (f) {
          if (wasmType === ValueType.f32) {
            builder.numeric(Instruction.f32SquareRoot);
          } else {
            builder.numeric(Instruction.f64SquareRoot);
          }
        } else {
          throw new Error("Sqrt is not defined for integers right now.");
        }
        stack.push(target);
      } else if (statement[0] === InstructionType.minimum) {
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
            builder.numeric(Instruction.f32Minimum);
          } else {
            builder.numeric(Instruction.f64Minimum);
          }
        } else {
          throw new Error("This operation is only defined for floats");
        }
        stack.push(target);
      } else if (statement[0] === InstructionType.maximum) {
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
            builder.numeric(Instruction.f32Maximum);
          } else {
            builder.numeric(Instruction.f64Maximum);
          }
        } else {
          throw new Error("This operation is only defined for floats");
        }
        stack.push(target);
      } else if (statement[0] === InstructionType.return) {
        const [, returnValues] = statement;
        const resultVariablesThatHaveToBeStored = returnValues.slice(1);
        let i32Index = 0;
        let i64Index = 0;
        let f32Index = 0;
        let f64Index = 0;
        let index = 0;
        for (const variable of resultVariablesThatHaveToBeStored) {
          const type = typeOf(variable);
          const valueType = convertToWasmType(type);
          let offset = -1;
          // TODO: UNSAFE
          builder.i32Const(0);
          prepareStack([resultVariablesThatHaveToBeStored[index]]);
          if (valueType === ValueType.i32) {
            offset = geti32ReturnOffset(i32Index);
            i32Index++;
            builder.store(Instruction.i32Store, { align: 0, offset });
          } else if (valueType === ValueType.i64) {
            offset = geti64ReturnOffset(i64Index);
            i64Index++;
            builder.store(Instruction.i64Store16, { align: 0, offset });
          } else if (valueType === ValueType.f32) {
            offset = getf32ReturnOffset(f32Index);
            f32Index++;
            builder.store(Instruction.f32Store, { align: 0, offset });
          } else if (valueType === ValueType.f64) {
            offset = getf64ReturnOffset(f64Index);
            f64Index++;
            builder.store(Instruction.f64Store, { align: 0, offset });
          }
          index++;
        }
        if (returnValues.length > 0) {
          prepareStack([returnValues[0]], true);
        }
        builder.return();
      }
      const writtenVars = getWrittenVariables(statement);
      for (const v of writtenVars) {
        environment.variablesWrittenToInCurrentBlock.add(v);
      }
      savePhiNodeReadVariables();
      environment.variablesWrittenToInCurrentBlock = new Set();
      environment.statementIndex++;
    }
    savePhiNodeReadVariables();
  } else if (block.type === BlockType.breakable) {
    clearStack();
    environment.sequenceBuilderStack.push(new InstructionSequenceBuilder());
    environment.stackArray.push([]);
    for (const b of block.blocks) {
      compileBlock(environment, b);
    }
    clearStack();
    const builder = environment.sequenceBuilderStack.pop();
    const stack = environment.stackArray.pop();
    if (builder === undefined) {
      throw new Error();
    }
    if (stack === undefined) {
      throw new Error();
    }
    const parentBuilder = getSequenceBuilder();
    parentBuilder.block(NonValueResultType.empty, builder);
  } else if (block.type === BlockType.loop) {
    clearStack();
    environment.sequenceBuilderStack.push(new InstructionSequenceBuilder());
    environment.stackArray.push([]);
    for (const b of block.blocks) {
      compileBlock(environment, b);
    }
    clearStack();
    const builder = environment.sequenceBuilderStack.pop();
    const stack = environment.stackArray.pop();
    if (builder === undefined) {
      throw new Error();
    }
    if (stack === undefined) {
      throw new Error();
    }
    const parentBuilder = getSequenceBuilder();
    parentBuilder.loop(NonValueResultType.empty, builder);
  } else if (block.type === BlockType.if) {
    prepareStack([block.condition]);
    environment.sequenceBuilderStack.push(new InstructionSequenceBuilder());
    environment.stackArray.push([]);
    for (const b of block.blocks) {
      compileBlock(environment, b);
    }
    clearStack();
    const builder = environment.sequenceBuilderStack.pop();
    const stack = environment.stackArray.pop();
    if (builder === undefined) {
      throw new Error();
    }
    if (stack === undefined) {
      throw new Error();
    }
    const parentBuilder = getSequenceBuilder();
    parentBuilder.if(NonValueResultType.empty, builder);
  } else if (block.type === BlockType.ifelse) {
    prepareStack([block.condition]);

    environment.sequenceBuilderStack.push(new InstructionSequenceBuilder());
    environment.stackArray.push([]);
    for (const b of block.true) {
      compileBlock(environment, b);
    }
    clearStack();
    const trueBuilder = environment.sequenceBuilderStack.pop();
    environment.stackArray.pop();
    if (trueBuilder === undefined) {
      throw new Error();
    }

    environment.sequenceBuilderStack.push(new InstructionSequenceBuilder());
    environment.stackArray.push([]);
    for (const b of block.false) {
      compileBlock(environment, b);
    }
    clearStack();
    const falseBuilder = environment.sequenceBuilderStack.pop();
    environment.stackArray.pop();
    if (falseBuilder === undefined) {
      throw new Error();
    }

    const parentBuilder = getSequenceBuilder();
    parentBuilder.ifElse(NonValueResultType.empty, trueBuilder, falseBuilder);
  }
}
