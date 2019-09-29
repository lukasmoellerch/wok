import * as IR from "../../IR/AST";
import { TypedArrayBytestreamConsumer } from "../../WASM/Encoding/TypedArrayBytestreamConsumer";
import { encodeUTF8String } from "../../WASM/Encoding/Utils";
import { ILValue } from "../AST/AST";
import { AssignmentStatement } from "../AST/Nodes/AssignmentStatement";
import { BinaryOperatorExpression } from "../AST/Nodes/BinaryOperatorExpression";
import { Block } from "../AST/Nodes/Block";
import { ConstantDeclaration } from "../AST/Nodes/ConstantDeclaration";
import { ConstructorCallExpression } from "../AST/Nodes/ConstructorCallExpression";
import { Expression } from "../AST/Nodes/Expression";
import { ExpressionWrapper } from "../AST/Nodes/ExpressionWrapper";
import { FloatingPointLiteralExpression } from "../AST/Nodes/FloatingPointLiteralExpression";
import { IdentifierCallExpression } from "../AST/Nodes/IdentifierCallExpression";
import { IfElseStatement } from "../AST/Nodes/IfElseStatement";
import { IfStatement } from "../AST/Nodes/IfStatement";
import { ImplictConversionExpression } from "../AST/Nodes/ImplictConversionExpression";
import { IntegerLiteralExpression } from "../AST/Nodes/IntegerLiteralExpression";
import { MemberCallExpression } from "../AST/Nodes/MemberCallExpression";
import { MemberReferenceExpression } from "../AST/Nodes/MemberReferenceExpression";
import { PostfixUnaryOperatorExpression } from "../AST/Nodes/PostfixUnaryOperatorExpression";
import { PrefixUnaryOperatorExpression } from "../AST/Nodes/PrefixUnaryOperatorExpression";
import { ReturnStatement } from "../AST/Nodes/ReturnStatement";
import { SourceFile } from "../AST/Nodes/SourceFile";
import { Statement } from "../AST/Nodes/Statement";
import { StringLiteralExpression } from "../AST/Nodes/StringLiteralExpression";
import { UnboundFunctionDeclaration } from "../AST/Nodes/UnboundFunctionDeclaration";
import { VariableDeclaration } from "../AST/Nodes/VariableDeclaration";
import { VariableReferenceExpression } from "../AST/Nodes/VariableReferenceExpression";
import { WhileStatement } from "../AST/Nodes/WhileStatement";
import { TypeTreeNode } from "../Type Scope/TypeScope";
import { ClassType } from "../Type/ClassType";
import { FunctionType } from "../Type/FunctionType";
import { NativeIntegerType, PointerType, StringType } from "../Type/NativeType";
import { StructType } from "../Type/StructType";
import { IType } from "../Type/Type";
import { VoidType } from "../Type/VoidType";
import { VariableScopeEntry, VariableScopeEntryType } from "../VariableScope/VariableScope";
import { CompileConstructor, CompileMethod, CompileOperator, CompilerTask, CompileStart, CompileUnboundFunctionTask } from "./CompilerTask";
interface ICompilerLValue {
  _compilerlvalue: void;
  writeIRValue(irValue: IRValue): void;
}
interface ICompilerRValue {
  _compilerrvalue: void;
  getAsIRValue(): IRValue;
}
class CompilerDirectIRValue implements ICompilerLValue, ICompilerRValue {
  public _compilerrv_compilerrvaluealue: void;
  public _compilerlvalue: void = undefined;
  public _compilerrvalue: void = undefined;
  public irValue: IRValue;
  private env: IRFunctionCompilationEnvironment;
  constructor(env: IRFunctionCompilationEnvironment, irValue: IRValue) {
    this.irValue = irValue;
    this.env = env;
  }
  public writeIRValue(irValue: IRValue): void {
    const targetIrVariables = this.irValue.irVariables;
    const valueIrVariables = irValue.irVariables;
    let i = 0;
    while (i < targetIrVariables.length) {
      this.env.writeStatement([IR.InstructionType.copy, targetIrVariables[i], valueIrVariables[i]]);
      i++;
    }
  }
  public getAsIRValue(): IRValue {
    return this.irValue;
  }
}
class CompilerPointerIRValue implements ICompilerLValue, ICompilerRValue {
  public _compilerlvalue: void;
  public _compilerrvalue: void;
  private baseVariable: ICompilerRValue;
  private baseOffset: number;
  private env: IRFunctionCompilationEnvironment;
  private type: IType;
  constructor(env: IRFunctionCompilationEnvironment, type: IType, baseVariable: ICompilerRValue, baseOffset: number = 0) {
    this.baseVariable = baseVariable;
    this.baseOffset = baseOffset;
    this.type = type;
    this.env = env;
  }
  public writeIRValue(irValue: IRValue): void {
    let baseVariable = this.baseVariable.getAsIRValue().irVariables[0];
    if (this.baseOffset !== 0) {
      const newBaseVariable = this.env.addIRLocal(IR.Type.ptr);
      const offsetVariable = this.env.addIRLocal(IR.Type.ptr);
      this.env.writeStatement([IR.InstructionType.setToConstant, offsetVariable, this.baseOffset]);
      this.env.writeStatement([IR.InstructionType.add, newBaseVariable, offsetVariable, baseVariable]);
      baseVariable = newBaseVariable;
    }
    generateStoreInstructions(this.env, this.type, irValue, baseVariable);
  }
  public getAsIRValue(): IRValue {
    const temp = this.env.generateValueOfType(this.type);
    let baseVariable = this.baseVariable.getAsIRValue().irVariables[0];
    if (this.baseOffset !== 0) {
      const newBaseVariable = this.env.addIRLocal(IR.Type.ptr);
      const offsetVariable = this.env.addIRLocal(IR.Type.ptr);
      this.env.writeStatement([IR.InstructionType.setToConstant, offsetVariable, this.baseOffset]);
      this.env.writeStatement([IR.InstructionType.add, newBaseVariable, offsetVariable, baseVariable]);
      baseVariable = newBaseVariable;
    }
    generateLoadInstructions(this.env, this.type, temp, baseVariable);
    return temp;
  }
}
class CompilerGlobalValue implements ICompilerLValue, ICompilerRValue {
  public _compilerlvalue: void;
  public _compilerrvalue: void;
  private baseOffset: number;
  private env: IRFunctionCompilationEnvironment;
  private type: IType;
  constructor(env: IRFunctionCompilationEnvironment, type: IType, baseOffset: number = 0) {
    this.baseOffset = baseOffset;
    this.type = type;
    this.env = env;
  }
  public writeIRValue(irValue: IRValue): void {
    const offsetVariable = this.env.addIRLocal(IR.Type.ptr);
    this.env.writeStatement([IR.InstructionType.setToConstant, offsetVariable, this.baseOffset]);
    generateStoreInstructions(this.env, this.type, irValue, offsetVariable);
  }
  public getAsIRValue(): IRValue {
    const temp = this.env.generateValueOfType(this.type);
    const offsetVariable = this.env.addIRLocal(IR.Type.ptr);
    this.env.writeStatement([IR.InstructionType.setToConstant, offsetVariable, this.baseOffset]);
    generateLoadInstructions(this.env, this.type, temp, offsetVariable);
    return temp;
  }
}
function generateStoreInstructions(env: IRFunctionCompilationEnvironment, type: IType, value: IRValue, ptr: number) {
  const ptrVariable = ptr;
  const layout = type.memoryMap();
  let index = 0;
  while (index < type.irVariablesNeededForRepresentation()) {
    const irVariable = value.irVariables[index];
    const memoryLocation = layout[index];
    const offset = memoryLocation.baseOffset;
    if (offset !== 0) {
      const offsetVariable = env.addIRLocal(IR.Type.ptr);
      env.writeStatement([IR.InstructionType.setToConstant, offsetVariable, offset]);
      env.writeStatement([IR.InstructionType.add, offsetVariable, offsetVariable, ptrVariable]);

      env.writeStatement([IR.InstructionType.store, offsetVariable, irVariable, memoryLocation.memoryType]);
    } else {
      env.writeStatement([IR.InstructionType.store, ptrVariable, irVariable, memoryLocation.memoryType]);
    }
    index++;
  }
}
function generateLoadInstructions(env: IRFunctionCompilationEnvironment, type: IType, target: IRValue, ptr: number) {
  const ptrVariable = ptr;
  const layout = type.memoryMap();
  let index = 0;
  while (index < type.irVariablesNeededForRepresentation()) {
    const irVariable = target.irVariables[index];
    const memoryLocation = layout[index];
    const offset = memoryLocation.baseOffset;
    if (offset !== 0) {
      const offsetVariable = env.addIRLocal(IR.Type.ptr);
      env.writeStatement([IR.InstructionType.setToConstant, offsetVariable, offset]);
      env.writeStatement([IR.InstructionType.add, offsetVariable, offsetVariable, ptrVariable]);

      env.writeStatement([IR.InstructionType.load, irVariable, offsetVariable, memoryLocation.memoryType]);
    } else {
      env.writeStatement([IR.InstructionType.load, irVariable, ptrVariable, memoryLocation.memoryType]);
    }
    index++;
  }
}
class IRValue {
  public index: number;
  public irVariables: number[];
  public type: IType;
  public name: string;
  constructor(index: number, irVariables: number[], type: IType, name: string = "<temporary>") {
    this.index = index;
    this.irVariables = irVariables;
    this.type = type;
    this.name = name;
  }
  public toCompilerDirectIRValue(env: IRFunctionCompilationEnvironment): CompilerDirectIRValue {
    return new CompilerDirectIRValue(env, this);
  }
}
class IRFunctionCompilationEnvironment {
  public localTypes: IR.Type[];
  public values: IRValue[] = [];
  public entryIndexValueIndexMapping: Map<number, number> = new Map();
  public declaration: IR.IInternalFunctionDeclaration;
  public irFunction: IR.IInternalFunctionDefinition;
  public blockArrayStack: IR.Block[][];
  constructor(functionIdentifier: string, functionType: FunctionType, tableElement: boolean) {
    const irFunctionType = functionType.irFunctionType;
    this.declaration = {
      identifier: functionIdentifier,
      type: irFunctionType,
      inlinable: false,
      exportedAs: undefined,
      tableElement,
      globalStateMutating: false,
    };
    const rootBlockArray: IR.Block[] = [];
    this.blockArrayStack = [rootBlockArray];
    this.localTypes = [];
    this.irFunction = {
      identifier: functionIdentifier,
      variableTypes: [],
      code: rootBlockArray,
    };
  }
  public finalize() {
    const functionType = this.declaration.type;
    const numArgs = functionType[0].length;
    const localTypes = this.localTypes.slice(numArgs);
    this.irFunction.variableTypes = localTypes;
  }
  public generateValueForEntry(entry: VariableScopeEntry): IRValue {
    const index = entry.index;
    const type = entry.type;
    if (type === undefined) {
      throw new Error();
    }
    const irValue = this.generateValueOfType(type);
    irValue.name = entry.str;
    this.entryIndexValueIndexMapping.set(index, irValue.index);
    return irValue;
  }
  public addIRLocal(type: IR.Type): number {
    const index = this.localTypes.length;
    this.localTypes.push(type);
    return index;
  }
  public generateValueOfType(type: IType): IRValue {
    const irTypes = type.irVariableTypes();
    const indices: number[] = [];
    for (const irLocalType of irTypes) {
      const irIndex = this.addIRLocal(irLocalType);
      indices.push(irIndex);
    }
    const index = this.values.length;
    const irValue = new IRValue(index, indices, type);
    this.values.push(irValue);
    return irValue;
  }
  public getValueForEntry(entry: VariableScopeEntry): IRValue {
    const index = entry.index;
    const valueIndex = this.entryIndexValueIndexMapping.get(index);
    if (valueIndex === undefined) {
      throw new Error();
    }
    const value = this.values[valueIndex];
    return value;
  }
  public writeStatement(statement: IR.SSAStatement) {
    const topBlockArray = this.blockArrayStack[this.blockArrayStack.length - 1];
    if (topBlockArray.length === 0) {
      const basicBlock: IR.IBasicBlock = {
        type: IR.BlockType.basic,
        statements: [statement],
      };
      topBlockArray.push(basicBlock);
    } else {
      const lastBlock = topBlockArray[topBlockArray.length - 1];
      if (lastBlock.type === IR.BlockType.basic) {
        lastBlock.statements.push(statement);
      } else {
        const basicBlock: IR.IBasicBlock = {
          type: IR.BlockType.basic,
          statements: [statement],
        };
        topBlockArray.push(basicBlock);
      }
    }
  }
  public pushBlockArray(blockArray: IR.Block[]) {
    this.blockArrayStack.push(blockArray);
  }
  public loopBlock(): IR.Block[] {
    const blockArray: IR.Block[] = [];
    const loopBlock: IR.ILoopBlock = {
      type: IR.BlockType.loop,
      blocks: blockArray,
    };
    this.blockArrayStack[this.blockArrayStack.length - 1].push(loopBlock);
    return blockArray;
  }
  public breakableBlock(): IR.Block[] {
    const blockArray: IR.Block[] = [];
    const breakableBlock: IR.IBreakableBlock = {
      type: IR.BlockType.breakable,
      blocks: blockArray,
    };
    this.blockArrayStack[this.blockArrayStack.length - 1].push(breakableBlock);
    return blockArray;
  }
  public ifBlock(condition: IRValue): IR.Block[] {
    const [irCondition] = condition.irVariables;
    const blockArray: IR.Block[] = [];
    const ifBlock: IR.IIfBlock = {
      type: IR.BlockType.if,
      condition: irCondition,
      blocks: blockArray,
    };
    this.blockArrayStack[this.blockArrayStack.length - 1].push(ifBlock);
    return blockArray;
  }
  public ifElseBlock(condition: IRValue): { true: IR.Block[], false: IR.Block[] } {
    const [irCondition] = condition.irVariables;
    const trueBlockArray: IR.Block[] = [];
    const falseBlockArray: IR.Block[] = [];
    const ifElseBlock: IR.IIfElseBlock = {
      type: IR.BlockType.ifelse,
      condition: irCondition,
      true: trueBlockArray,
      false: falseBlockArray,
    };
    this.blockArrayStack[this.blockArrayStack.length - 1].push(ifElseBlock);
    return {
      true: trueBlockArray,
      false: falseBlockArray,
    };
  }
  public popBlock() {
    this.blockArrayStack.pop();
  }
}
class CompilerGlobal {
  constructor(public baseOffset: number, public type: IType) { }
}
export class IRCompiler {
  public compilationUnit: IR.ICompilationUnit = {
    mutableGlobals: [],
    dataSegments: [],
    externalFunctionDeclarations: [],
    internalFunctionDeclarations: [],
    functionCode: [],
  };
  private constantStringDataSegmentMapping: Map<string, number> = new Map();
  private unboundFunctionTaskMap: Map<UnboundFunctionDeclaration, CompileUnboundFunctionTask> = new Map();
  private constructorTaskMap: Map<IType, CompileConstructor> = new Map();
  private operatorTaskMap: Map<IType, Map<string, Map<number, CompileOperator>>> = new Map();
  private methodTaskMap: Map<IType, Map<string, Map<number, CompileMethod>>> = new Map();
  private globals: Map<string, CompilerGlobal> = new Map();
  constructor(private rootTypeTreeNode: TypeTreeNode, private tasks: CompilerTask[]) { }

  public compile() {
    function getMapDefault<K, V>(map: Map<K, V>, key: K, def: V): V {
      const value = map.get(key);
      if (value !== undefined) {
        return value;
      }
      map.set(key, def);
      return def;
    }
    for (const task of this.tasks) {
      if (task instanceof CompileUnboundFunctionTask) {
        this.unboundFunctionTaskMap.set(task.declaration, task);
      } else if (task instanceof CompileConstructor) {
        this.constructorTaskMap.set(task.type, task);
      } else if (task instanceof CompileOperator) {
        const type = getMapDefault(this.operatorTaskMap, task.type, new Map<string, Map<number, CompileOperator>>());
        const operator = getMapDefault(type, task.str, new Map<number, CompileOperator>());
        operator.set(task.arity, task);
      } else if (task instanceof CompileMethod) {
        const type = getMapDefault(this.methodTaskMap, task.type, new Map<string, Map<number, CompileMethod>>());
        const method = getMapDefault(type, task.str, new Map<number, CompileMethod>());
        method.set(task.arity, task);
      } else if (task instanceof CompileStart) {
        let startIndex = 0;
        for (const entry of task.sourceFile.variables) {
          const type = entry.type;
          if (type === undefined) {
            throw new Error();
          }
          const global = new CompilerGlobal(startIndex, type);
          this.globals.set(entry.str, global);
          startIndex += type.memorySize();
        }
      }
    }
    for (const task of this.tasks) {
      if (task instanceof CompileUnboundFunctionTask) {
        this.compileUnboundFunctionDeclaration(task.declaration, task.indirectlyReferenced);
      } else if (task instanceof CompileConstructor) {
        this.compileConstructor(task.type);
      } else if (task instanceof CompileOperator) {
        this.compileOperator(task.type, task.str, task.arity);
      } else if (task instanceof CompileMethod) {
        this.compileMethod(task.type, task.str, task.arity, task.indirectlyReferenced);
      } else if (task instanceof CompileStart) {
        this.compileStart(task.sourceFile);
      }
    }
  }
  private getDataSegmentIndexForConstantString(str: string): number {
    const result = this.constantStringDataSegmentMapping.get(str);
    if (result !== undefined) {
      return result;
    }
    const newIndex = this.compilationUnit.dataSegments.length;
    const consumer = new TypedArrayBytestreamConsumer();
    encodeUTF8String(str, consumer);
    const content = consumer.cleanArray;
    const dataSegment: IR.IDataSegment = {
      content,
    };
    this.compilationUnit.dataSegments.push(dataSegment);
    this.constantStringDataSegmentMapping.set(str, newIndex);
    return newIndex;
  }
  private getUnboundFunctionName(declaration: UnboundFunctionDeclaration): string {
    const task = this.unboundFunctionTaskMap.get(declaration);
    if (task === undefined) {
      throw new Error();
    }
    return task.irName();
  }
  private getConstructorFunctionName(type: IType): string {
    const task = this.constructorTaskMap.get(type);
    if (task === undefined) {
      throw new Error();
    }
    return task.irName();
  }
  private getMethodFunctionName(type: IType, method: string, arity: number): string {
    const typeMap = this.methodTaskMap.get(type);
    if (typeMap === undefined) {
      throw new Error();
    }
    const nameMap = typeMap.get(method);
    if (nameMap === undefined) {
      throw new Error();
    }
    const task = nameMap.get(arity);
    if (task === undefined) {
      throw new Error();
    }
    return task.irName();
  }
  private getOperatorFunctionName(type: IType, method: string, arity: number): string {
    const typeMap = this.operatorTaskMap.get(type);
    if (typeMap === undefined) {
      throw new Error();
    }
    const nameMap = typeMap.get(method);
    if (nameMap === undefined) {
      throw new Error();
    }
    const task = nameMap.get(arity);
    if (task === undefined) {
      throw new Error();
    }
    return task.irName();
  }
  private checkForeign(decoratorMap: Map<string, ExpressionWrapper[]>): string | undefined {
    const foreignParameters = decoratorMap.get("foreign");
    if (foreignParameters !== undefined) {
      if (foreignParameters.length !== 1) {
        // TODO Add a compiler error instead of throwing a js error.
        throw new Error();
      }
      const expression = foreignParameters[0].expression;
      if (expression === undefined) {
        // Should not happen as a compiler error would be added first
        throw new Error();
      }
      if (!(expression instanceof StringLiteralExpression)) {
        // TODO Handle this error
        throw new Error();
      }
      const str = expression.stringLiteralToken.content;
      const externalName = str.substring(1, str.length - 1);
      return externalName;
    }
    return undefined;
  }
  private compileConstructor(type: IType) {
    const functionName = this.getConstructorFunctionName(type);
    const functionType = type.typeOfConstructor();
    if (functionType === undefined) {
      throw new Error();
    }
    const irType = functionType.irFunctionType;
  }
  private compileOperator(_type: IType, _name: string, _arity: number) {

  }
  private compileMethod(type: IType, name: string, arity: number, tableElement: boolean) {
    const functionType = type.typeOfMember(name);
    if (functionType === undefined) {
      throw new Error();
    }
    if (!(functionType instanceof FunctionType)) {
      throw new Error();
    }
    const identifier = this.getMethodFunctionName(type, name, arity);
    const environment = new IRFunctionCompilationEnvironment(identifier, functionType, tableElement);
    if (type instanceof PointerType) {
      if (name === "store") {
        // this argument
        const thisValue = environment.generateValueOfType(type);
        const arg = environment.generateValueOfType(type.stored);
        generateStoreInstructions(environment, type.stored, arg, thisValue.irVariables[0]);
      } else if (name === "load") {
        // this argument
        const thisValue = environment.generateValueOfType(type);
        const resultValue = environment.generateValueOfType(type.stored);
        generateLoadInstructions(environment, type.stored, resultValue, thisValue.irVariables[0]);
        environment.writeStatement([IR.InstructionType.return, resultValue.irVariables]);
      }
    } else if (type instanceof StructType) {

      const declaration = type.methodDeclarationMap.get(name);
      if (declaration === undefined) {
        throw new Error();
      }
      const thisEntry = declaration.thisEntry;
      if (thisEntry !== undefined) {
        thisEntry.type = type;
      }
      const block = declaration.block;
      if (block === undefined) {
        throw new Error();
      }
      const entries = declaration.variables;
      for (const entry of entries) {
        if (entry.entryType === VariableScopeEntryType.self) {
          environment.generateValueForEntry(entry);
        }
      }
      for (const entry of entries) {
        if (entry.entryType === VariableScopeEntryType.argument) {
          environment.generateValueForEntry(entry);
        }
      }
      for (const entry of entries) {
        if (entry.entryType === VariableScopeEntryType.constant) {
          environment.generateValueForEntry(entry);
        }
      }
      for (const entry of entries) {
        if (entry.entryType === VariableScopeEntryType.variable) {
          environment.generateValueForEntry(entry);
        }
      }
      this.compileBlock(environment, block);
    } else if (type instanceof ClassType) {

      const declaration = type.methodDeclarationMap.get(name);
      if (declaration === undefined) {
        throw new Error();
      }
      const thisEntry = declaration.thisEntry;
      if (thisEntry !== undefined) {
        thisEntry.type = type;
      }
      const block = declaration.block;
      if (block === undefined) {
        throw new Error();
      }
      const entries = declaration.variables;
      for (const entry of entries) {
        if (entry.entryType === VariableScopeEntryType.self) {
          environment.generateValueForEntry(entry);
        }
      }
      for (const entry of entries) {
        if (entry.entryType === VariableScopeEntryType.argument) {
          environment.generateValueForEntry(entry);
        }
      }
      for (const entry of entries) {
        if (entry.entryType === VariableScopeEntryType.constant) {
          environment.generateValueForEntry(entry);
        }
      }
      for (const entry of entries) {
        if (entry.entryType === VariableScopeEntryType.variable) {
          environment.generateValueForEntry(entry);
        }
      }
      this.compileBlock(environment, block);
    }

    environment.finalize();

    environment.declaration.exportedAs = undefined;
    environment.declaration.inlinable = false;
    environment.declaration.tableElement = true;

    this.compilationUnit.internalFunctionDeclarations.push(environment.declaration);
    this.compilationUnit.functionCode.push(environment.irFunction);
  }
  private compileStart(sourceFile: SourceFile) {
    const exportName = "start";
    const identifier = "_start";
    const functionType = new FunctionType(this.rootTypeTreeNode, [], new VoidType(this.rootTypeTreeNode), undefined);
    const environment = new IRFunctionCompilationEnvironment(identifier, functionType, false);
    for (const statement of sourceFile.topLevelDeclarations) {
      if (!(statement instanceof Statement)) {
        continue;
      }
      this.compileStatement(environment, statement);
    }

    environment.finalize();

    environment.declaration.exportedAs = exportName;
    environment.declaration.inlinable = false;

    this.compilationUnit.internalFunctionDeclarations.push(environment.declaration);
    this.compilationUnit.functionCode.push(environment.irFunction);
  }
  private compileUnboundFunctionDeclaration(unboundFunctionDeclaration: UnboundFunctionDeclaration, tableElement: boolean) {
    const foreignName = this.checkForeign(unboundFunctionDeclaration.decoratorMap);
    if (foreignName !== undefined) {
      const externalName = foreignName;
      const name = this.getUnboundFunctionName(unboundFunctionDeclaration);
      const externalFunctionDeclaration: IR.IExternalFunctionDeclaration = {
        identifier: name,
        externalName,
        tableElement,
        type: unboundFunctionDeclaration.getFunctionType(this.rootTypeTreeNode).irFunctionType,
      };
      this.compilationUnit.externalFunctionDeclarations.push(externalFunctionDeclaration);
      return;
    }

    const isNative = unboundFunctionDeclaration.decoratorMap.has("native");
    if (isNative) {
      return;
    }
    let exportName: string | undefined;
    const exportParameters = unboundFunctionDeclaration.decoratorMap.get("export");
    if (exportParameters !== undefined) {
      if (exportParameters.length !== 1) {
        // TODO Add a compiler error instead of throwing a js error.
        throw new Error();
      }
      const expression = exportParameters[0].expression;
      if (expression === undefined) {
        // Should not happen as a compiler error would be added first
        throw new Error();
      }
      if (!(expression instanceof StringLiteralExpression)) {
        // TODO Handle this error
        throw new Error();
      }
      exportName = expression.stringLiteralToken.content;
    }
    const inlineHint = unboundFunctionDeclaration.decoratorMap.has("inline");

    const entries = unboundFunctionDeclaration.variables;
    const block = unboundFunctionDeclaration.block;
    const identifier = this.getUnboundFunctionName(unboundFunctionDeclaration);
    const functionType = unboundFunctionDeclaration.getFunctionType(this.rootTypeTreeNode);
    const environment = new IRFunctionCompilationEnvironment(identifier, functionType, tableElement);
    for (const entry of entries) {
      if (entry.entryType === VariableScopeEntryType.argument) {
        environment.generateValueForEntry(entry);
      }
    }
    for (const entry of entries) {
      if (entry.entryType !== VariableScopeEntryType.argument) {
        environment.generateValueForEntry(entry);
      }
    }
    if (block !== undefined) {
      this.compileBlock(environment, block);
    }

    environment.finalize();

    environment.declaration.exportedAs = exportName;
    environment.declaration.inlinable = inlineHint;

    this.compilationUnit.internalFunctionDeclarations.push(environment.declaration);
    this.compilationUnit.functionCode.push(environment.irFunction);
  }
  private compileBlock(env: IRFunctionCompilationEnvironment, block: Block) {
    for (const statement of block.statements) {
      this.compileStatement(env, statement);
    }
  }
  private compileStatement(env: IRFunctionCompilationEnvironment, statement: Statement) {
    if (statement instanceof ExpressionWrapper) {
      this.compileExpressionWrapper(env, statement);
      return;
    } else if (statement instanceof IfStatement) {
      this.compileIfStatement(env, statement);
      return;
    } else if (statement instanceof WhileStatement) {
      this.compileWhileStatement(env, statement);
      return;
    } else if (statement instanceof VariableDeclaration) {
      this.compileVariableDeclaration(env, statement);
      return;
    } else if (statement instanceof ConstantDeclaration) {
      this.compileConstantDeclaration(env, statement);
      return;
    } else if (statement instanceof AssignmentStatement) {
      this.compileAssignmentStatement(env, statement);
      return;
    } else if (statement instanceof ReturnStatement) {
      this.compileReturnStatement(env, statement);
      return;
    } else if (statement instanceof IfElseStatement) {
      this.compileIfElseStatement(env, statement);
      return;
    }
    throw new Error();
  }

  private compileExpressionWrapper(env: IRFunctionCompilationEnvironment, expressionWrapper: ExpressionWrapper) {
    const expression = expressionWrapper.expression;
    if (expression instanceof Expression) {
      this.getExpressionAsValue(env, expression);
    } else if (expression instanceof AssignmentStatement) {
      this.compileAssignmentStatement(env, expression);
    }
  }
  private compileIfElseStatement(env: IRFunctionCompilationEnvironment, ifElseStatement: IfElseStatement) {
    const expressionWrapper = ifElseStatement.condition;
    const expression = expressionWrapper.expression;
    if (expression === undefined) {
      throw new Error();
    } else if (!(expression instanceof Expression)) {
      throw new Error();
    }
    const condition = this.getExpressionAsValue(env, expression);
    const ifElse = env.ifElseBlock(condition.getAsIRValue());
    env.pushBlockArray(ifElse.true);
    this.compileBlock(env, ifElseStatement.trueBlock);
    env.popBlock();

    env.pushBlockArray(ifElse.false);
    this.compileBlock(env, ifElseStatement.falseBlocK);
    env.popBlock();
  }
  private compileIfStatement(env: IRFunctionCompilationEnvironment, ifStatement: IfStatement) {
    const expressionWrapper = ifStatement.condition;
    const expression = expressionWrapper.expression;
    if (expression === undefined) {
      throw new Error();
    } else if (!(expression instanceof Expression)) {
      throw new Error();
    }
    const condition = this.getExpressionAsValue(env, expression);
    const array = env.ifBlock(condition.getAsIRValue());
    env.pushBlockArray(array);

    this.compileBlock(env, ifStatement.block);
    env.popBlock();
  }
  private compileWhileStatement(env: IRFunctionCompilationEnvironment, whileStatement: WhileStatement) {
    const expressionWrapper = whileStatement.condition;
    const expression = expressionWrapper.expression;
    if (expression === undefined) {
      throw new Error();
    } else if (!(expression instanceof Expression)) {
      throw new Error();
    }
    const breabableBlock = env.breakableBlock();
    env.pushBlockArray(breabableBlock);
    const condition = this.getExpressionAsValue(env, expression);
    const [irVariable] = condition.getAsIRValue().irVariables;
    env.writeStatement([IR.InstructionType.breakIfFalse, irVariable]);
    const loopBlock = env.loopBlock();
    env.pushBlockArray(loopBlock);
    this.compileBlock(env, whileStatement.block);
    const loopRepeatCondition = this.getExpressionAsValue(env, expression);
    const [loopIRVariable] = loopRepeatCondition.getAsIRValue().irVariables;
    env.writeStatement([IR.InstructionType.breakIf, loopIRVariable]);
    env.popBlock();
    env.popBlock();
  }
  private getEntryAsRValue(env: IRFunctionCompilationEnvironment, entry: VariableScopeEntry): ICompilerRValue {
    const entryType = entry.entryType;
    if (entryType === VariableScopeEntryType.argument) {
      return env.getValueForEntry(entry).toCompilerDirectIRValue(env);
    } else if (entryType === VariableScopeEntryType.constant) {
      return env.getValueForEntry(entry).toCompilerDirectIRValue(env);
    } else if (entryType === VariableScopeEntryType.variable) {
      return env.getValueForEntry(entry).toCompilerDirectIRValue(env);
    } else if (entryType === VariableScopeEntryType.self) {
      return env.getValueForEntry(entry).toCompilerDirectIRValue(env);
    } else if (entryType === VariableScopeEntryType.globalConstant) {
      const global = this.globals.get(entry.str);
      if (global === undefined) {
        throw new Error();
      }
      const variable = new CompilerGlobalValue(env, global.type, global.baseOffset);
      return variable;
    } else if (entryType === VariableScopeEntryType.globalVariable) {
      const global = this.globals.get(entry.str);
      if (global === undefined) {
        throw new Error();
      }
      const variable = new CompilerGlobalValue(env, global.type, global.baseOffset);
      return variable;
    } else {
      throw new Error();
    }
  }
  private getEntryAsLValue(env: IRFunctionCompilationEnvironment, entry: VariableScopeEntry): ICompilerLValue {
    const entryType = entry.entryType;
    if (entryType === VariableScopeEntryType.argument) {
      return env.getValueForEntry(entry).toCompilerDirectIRValue(env);
    } else if (entryType === VariableScopeEntryType.constant) {
      return env.getValueForEntry(entry).toCompilerDirectIRValue(env);
    } else if (entryType === VariableScopeEntryType.variable) {
      return env.getValueForEntry(entry).toCompilerDirectIRValue(env);
    } else if (entryType === VariableScopeEntryType.globalConstant) {
      const global = this.globals.get(entry.str);
      if (global === undefined) {
        throw new Error();
      }
      const variable = new CompilerGlobalValue(env, global.type, global.baseOffset);
      return variable;
    } else if (entryType === VariableScopeEntryType.globalVariable) {
      const global = this.globals.get(entry.str);
      if (global === undefined) {
        throw new Error();
      }
      const variable = new CompilerGlobalValue(env, global.type, global.baseOffset);
      return variable;
    } else {
      throw new Error();
    }
  }
  private compileVariableDeclaration(env: IRFunctionCompilationEnvironment, variableDeclaration: VariableDeclaration) {
    const entry = variableDeclaration.entry;
    if (entry === undefined) {
      throw new Error();
    }
    const expressionWrapper = variableDeclaration.value;
    const expression = expressionWrapper.expression;
    if (expression instanceof Expression) {
      const target = this.getEntryAsLValue(env, entry);
      this.compileExpression(env, expression, target);
    }
  }
  private compileConstantDeclaration(env: IRFunctionCompilationEnvironment, constantDeclaration: ConstantDeclaration) {
    const entry = constantDeclaration.entry;
    if (entry === undefined) {
      throw new Error();
    }
    const expressionWrapper = constantDeclaration.value;
    const expression = expressionWrapper.expression;
    if (expression instanceof Expression) {
      const target = this.getEntryAsLValue(env, entry);
      this.compileExpression(env, expression, target);
    }
  }
  private compileAssignmentStatement(env: IRFunctionCompilationEnvironment, assignmentStatement: AssignmentStatement) {
    const lvalue = assignmentStatement.target;
    const value = this.getLValue(env, lvalue);
    const expression = assignmentStatement.value;
    this.compileExpression(env, expression, value);
  }
  private compileReturnStatement(env: IRFunctionCompilationEnvironment, returnStatement: ReturnStatement) {
    const returnValue = returnStatement.value;
    if (returnValue !== undefined) {
      const expression = returnValue.expression;
      if (expression === undefined) {
        throw new Error();
      }
      if (!(expression instanceof Expression)) {
        throw new Error();
      }
      const value = this.getExpressionAsValue(env, expression);
      env.writeStatement([IR.InstructionType.return, value.getAsIRValue().irVariables]);
    } else {
      env.writeStatement([IR.InstructionType.return, []]);
    }
  }
  private getLValue(env: IRFunctionCompilationEnvironment, lValue: ILValue): ICompilerLValue {
    if (lValue instanceof VariableReferenceExpression) {
      return this.getLValueOfVariableReferenceExpression(env, lValue);
    } else if (lValue instanceof MemberReferenceExpression) {
      const lhsType = lValue.lhs.forceType();
      if (lhsType instanceof StructType) {
        const lhs = this.getExpressionAsValue(env, lValue.lhs);
        return this.getStructMemberAsValue(env, lhs.getAsIRValue(), lValue.memberToken.content);
      } else if (lhsType instanceof ClassType) {
        const lhs = this.getExpressionAsValue(env, lValue.lhs);
        const memory = lhsType.instanceMemoryMapData.get(lValue.memberToken.content);
        if (memory === undefined) {
          throw new Error();
        }
        const memberType = lhsType.typeOfMember(lValue.memberToken.content);
        if (memberType === undefined) {
          throw new Error();
        }
        return new CompilerPointerIRValue(env, memberType, lhs, memory.baseOffset);
      } else {
        throw new Error();
      }
    }
    throw new Error("Not implemented");
  }
  private getIRValueOfLValue(env: IRFunctionCompilationEnvironment, lValue: ILValue): IRValue {
    if (lValue instanceof VariableReferenceExpression) {
      return this.getIRValueOfVariableReferenceExpression(env, lValue);
    } else if (lValue instanceof MemberReferenceExpression) {
      const lhsType = lValue.lhs.forceType();
      if (lhsType instanceof StructType) {
        const lhs = this.getExpressionAsValue(env, lValue.lhs);
        return this.getStructMemberAsValue(env, lhs.getAsIRValue(), lValue.memberToken.content).getAsIRValue();
      } else {
        throw new Error();
      }
    }
    throw new Error("Not implemented");
  }
  private compileVariableReferenceExpression(env: IRFunctionCompilationEnvironment, expression: VariableReferenceExpression, target: IRValue | undefined) {
    if (target === undefined) {
      return;
    }
    const entry = expression.entry;
    if (entry === undefined) {
      throw new Error();
    }
    if (entry.entryType === VariableScopeEntryType.globalUnboundFunction) {
      const declaration = entry.declaration as UnboundFunctionDeclaration;
      const name = this.getUnboundFunctionName(declaration);
      env.writeStatement([IR.InstructionType.setToFunction, target.irVariables[0], name]);
    } else {
      const irValue = this.getIRValueOfVariableReferenceExpression(env, expression);
      let i = 0;
      const targetIrVariables = target.irVariables;
      const valueIrVariables = irValue.irVariables;
      while (i < targetIrVariables.length) {
        env.writeStatement([IR.InstructionType.copy, targetIrVariables[i], valueIrVariables[i]]);
        i++;
      }
    }
  }
  private getRValueOfVariableReferenceExpression(env: IRFunctionCompilationEnvironment, variableReferenceExpression: VariableReferenceExpression): ICompilerRValue {
    const entry = variableReferenceExpression.entry;
    if (entry === undefined) {
      throw new Error("Variable has no entry associated with it");
    }
    if (entry.entryType === VariableScopeEntryType.globalUnboundFunction) {
      const declaration = entry.declaration as UnboundFunctionDeclaration;
      const name = this.getUnboundFunctionName(declaration);
      const temporary = env.generateValueOfType(declaration.getFunctionType(this.rootTypeTreeNode));
      env.writeStatement([IR.InstructionType.setToFunction, temporary.irVariables[0], name]);
      return temporary.toCompilerDirectIRValue(env);
    } else {
      const value = env.getValueForEntry(entry);
      return value.toCompilerDirectIRValue(env);
    }
  }
  private getLValueOfVariableReferenceExpression(env: IRFunctionCompilationEnvironment, variableReferenceExpression: VariableReferenceExpression): ICompilerLValue {
    const entry = variableReferenceExpression.entry;
    if (entry === undefined) {
      throw new Error("Variable has no entry associated with it");
    }
    if (entry.entryType === VariableScopeEntryType.globalUnboundFunction) {
      throw new Error();
    } else {
      return this.getEntryAsLValue(env, entry);
    }
  }
  private getIRValueOfVariableReferenceExpression(env: IRFunctionCompilationEnvironment, variableReferenceExpression: VariableReferenceExpression): IRValue {
    const entry = variableReferenceExpression.entry;
    if (entry === undefined) {
      throw new Error("Variable has no entry associated with it");
    }
    if (entry.entryType === VariableScopeEntryType.globalUnboundFunction) {
      const declaration = entry.declaration as UnboundFunctionDeclaration;
      const name = this.getUnboundFunctionName(declaration);
      const temporary = env.generateValueOfType(declaration.getFunctionType(this.rootTypeTreeNode));
      env.writeStatement([IR.InstructionType.setToFunction, temporary.irVariables[0], name]);
      return temporary;
    } else {
      return this.getEntryAsRValue(env, entry).getAsIRValue();
    }
  }
  private compileExpression(env: IRFunctionCompilationEnvironment, expression: Expression, target?: ICompilerLValue) {
    if (expression instanceof BinaryOperatorExpression) {
      if (target instanceof CompilerDirectIRValue) {
        this.compileBinaryOperatorExpression(env, expression, target.irValue);
      } else if (target !== undefined) {
        const temporary = env.generateValueOfType(expression.forceType());
        this.compileBinaryOperatorExpression(env, expression, temporary);
        target.writeIRValue(temporary);
      } else {
        this.compileBinaryOperatorExpression(env, expression, undefined);
      }
      return;
    } else if (expression instanceof PostfixUnaryOperatorExpression) {
      if (target instanceof CompilerDirectIRValue) {
        this.compilePostfixUnaryOperatorExpression(env, expression, target.irValue);
      } else if (target !== undefined) {
        const temporary = env.generateValueOfType(expression.forceType());
        this.compilePostfixUnaryOperatorExpression(env, expression, temporary);
        target.writeIRValue(temporary);
      } else {
        this.compilePostfixUnaryOperatorExpression(env, expression, undefined);
      }
      return;
    } else if (expression instanceof PrefixUnaryOperatorExpression) {
      if (target instanceof CompilerDirectIRValue) {
        this.compilePrefixUnaryOperatorExpression(env, expression, target.irValue);
      } else if (target !== undefined) {
        const temporary = env.generateValueOfType(expression.forceType());
        this.compilePrefixUnaryOperatorExpression(env, expression, temporary);
        target.writeIRValue(temporary);
      } else {
        this.compilePrefixUnaryOperatorExpression(env, expression, undefined);
      }
      return;
    } else if (expression instanceof IntegerLiteralExpression) {
      if (target instanceof CompilerDirectIRValue) {
        this.compileIntegerLiteralExpression(env, expression, target.irValue);
      } else if (target !== undefined) {
        const temporary = env.generateValueOfType(expression.forceType());
        this.compileIntegerLiteralExpression(env, expression, temporary);
        target.writeIRValue(temporary);
      } else {
        return;
      }
      return;
    } else if (expression instanceof FloatingPointLiteralExpression) {
      if (target instanceof CompilerDirectIRValue) {
        this.compileFloatingPointLiteralExpression(env, expression, target.irValue);
      } else if (target !== undefined) {
        const temporary = env.generateValueOfType(expression.forceType());
        this.compileFloatingPointLiteralExpression(env, expression, temporary);
        target.writeIRValue(temporary);
      } else {
        return;
      }
      return;
    } else if (expression instanceof StringLiteralExpression) {
      if (target instanceof CompilerDirectIRValue) {
        this.compileStringLiteralExpression(env, expression, target.irValue);
      } else if (target !== undefined) {
        const temporary = env.generateValueOfType(expression.forceType());
        this.compileStringLiteralExpression(env, expression, temporary);
        target.writeIRValue(temporary);
      } else {
        return;
      }
      return;
    } else if (expression instanceof VariableReferenceExpression) {
      if (target instanceof CompilerDirectIRValue) {
        this.compileVariableReferenceExpression(env, expression, target.irValue);
      } else if (target !== undefined) {
        const temporary = env.generateValueOfType(expression.forceType());
        this.compileVariableReferenceExpression(env, expression, temporary);
        target.writeIRValue(temporary);
      } else {
        return;
      }
      return;
    } else if (expression instanceof ImplictConversionExpression) {
      if (target instanceof CompilerDirectIRValue) {
        this.compileImplictConversionExpression(env, expression, target.irValue);
      } else if (target !== undefined) {
        const temporary = env.generateValueOfType(expression.forceType());
        this.compileImplictConversionExpression(env, expression, temporary);
        target.writeIRValue(temporary);
      } else {
        this.compileExpression(env, expression.value);
      }
      return;
    } else if (expression instanceof IdentifierCallExpression) {
      if (target instanceof CompilerDirectIRValue) {
        this.compileIdentifierCallExpression(env, expression, target.irValue);
      } else if (target !== undefined) {
        const temporary = env.generateValueOfType(expression.forceType());
        this.compileIdentifierCallExpression(env, expression, temporary);
        target.writeIRValue(temporary);
      } else {
        this.compileIdentifierCallExpression(env, expression, undefined);
      }
      return;
    } else if (expression instanceof ConstructorCallExpression) {
      const constructedType = expression.type;
      if (constructedType instanceof StructType) {
        if (target === undefined && constructedType.constructorDeclaration === undefined) {
          return;
        }
      }
      if (target instanceof CompilerDirectIRValue) {
        this.compileConstructorCallExpression(env, expression, target.irValue);
      } else if (target !== undefined) {
        const temporary = env.generateValueOfType(expression.forceType());
        this.compileConstructorCallExpression(env, expression, temporary);
        target.writeIRValue(temporary);
      } else {
        this.compileConstructorCallExpression(env, expression, undefined);
      }
      return;
    } else if (expression instanceof MemberReferenceExpression) {
      // TODO: Use getStructMemberAsValue
      const lhs = this.getExpressionAsValue(env, expression.lhs).getAsIRValue();
      const value = this.getStructMemberAsValue(env, lhs, expression.memberToken.content);
      if (target !== undefined) {
        target.writeIRValue(value.getAsIRValue());
      }
      const type = expression.lhs.forceType();
    } else if (expression instanceof MemberCallExpression) {
      if (target instanceof CompilerDirectIRValue) {
        this.compileMemberCallExpression(env, expression, target.irValue);
      } else if (target !== undefined) {
        const temporary = env.generateValueOfType(expression.forceType());
        this.compileMemberCallExpression(env, expression, temporary);
        target.writeIRValue(temporary);
      } else {
        this.compileMemberCallExpression(env, expression, undefined);
      }
      return;
    }
    throw new Error();
  }
  private compileConstructorCallExpression(env: IRFunctionCompilationEnvironment, expression: ConstructorCallExpression, target: IRValue | undefined) {
    const constructedType = expression.constructedType;
    if (constructedType instanceof StructType) {
      if (constructedType.constructorDeclaration === undefined) {
        if (target === undefined) {
          return;
        }
        let propertyIndex = 0;
        for (const arg of expression.args) {
          const propertyName = constructedType.properties[propertyIndex];
          const value = this.getStructMemberAsValue(env, target, propertyName);
          this.compileExpression(env, arg, value);
          propertyIndex++;
        }
        return;
      }
      throw new Error();
      // TODO: Handle custom constructor
    } else if (constructedType instanceof PointerType) {
      if (target === undefined) {
        return;
      }
      // TODO: Create new target with proper type
      this.compileExpression(env, expression.args[0], target.toCompilerDirectIRValue(env));
      return;
    } else if (constructedType instanceof ClassType) {
      if (constructedType.constructorDeclaration === undefined) {
        const basePtr = target ? target.irVariables[0] : env.addIRLocal(IR.Type.ptr);
        env.writeStatement([IR.InstructionType.setToConstant, basePtr, 12]);
        if (target === undefined) {
          return;
        }
        let propertyIndex = 0;
        for (const arg of expression.args) {
          const propertyName = constructedType.properties[propertyIndex];
          const propertyType = constructedType.propertyTypeMap.get(propertyName);
          if (propertyType === undefined) {
            throw new Error();
          }
          const offset = constructedType.instanceMemoryMapData.get(propertyName);
          if (offset === undefined) {
            throw new Error();
          }
          const ptr = env.addIRLocal(IR.Type.ptr);
          const offsetVar = env.addIRLocal(IR.Type.ptr);
          env.writeStatement([IR.InstructionType.setToConstant, offsetVar, offset.baseOffset]);
          env.writeStatement([IR.InstructionType.add, ptr, offsetVar, basePtr]);
          const value = this.getExpressionAsValue(env, arg);
          generateStoreInstructions(env, propertyType, value.getAsIRValue(), ptr);
          propertyIndex++;
        }
        return;
      }
      throw new Error();
      // TODO: Handle custom constructor
    }
    throw new Error();
    // TODO: Handle other constructable types
  }
  private getExpressionAsValue(env: IRFunctionCompilationEnvironment, expression: Expression): ICompilerRValue {
    if (expression instanceof BinaryOperatorExpression) {
      const temporary = env.generateValueOfType(expression.forceType());
      this.compileBinaryOperatorExpression(env, expression, temporary);
      return temporary.toCompilerDirectIRValue(env);
    } else if (expression instanceof PostfixUnaryOperatorExpression) {
      const temporary = env.generateValueOfType(expression.forceType());
      this.compilePostfixUnaryOperatorExpression(env, expression, temporary);
      return temporary.toCompilerDirectIRValue(env);
    } else if (expression instanceof PrefixUnaryOperatorExpression) {
      const temporary = env.generateValueOfType(expression.forceType());
      this.compilePrefixUnaryOperatorExpression(env, expression, temporary);
      return temporary.toCompilerDirectIRValue(env);
    } else if (expression instanceof IntegerLiteralExpression) {
      const temporary = env.generateValueOfType(expression.forceType());
      this.compileIntegerLiteralExpression(env, expression, temporary);
      return temporary.toCompilerDirectIRValue(env);
    } else if (expression instanceof StringLiteralExpression) {
      const temporary = env.generateValueOfType(expression.forceType());
      this.compileStringLiteralExpression(env, expression, temporary);
      return temporary.toCompilerDirectIRValue(env);
    } else if (expression instanceof FloatingPointLiteralExpression) {
      const temporary = env.generateValueOfType(expression.forceType());
      this.compileFloatingPointLiteralExpression(env, expression, temporary);
      return temporary.toCompilerDirectIRValue(env);
    } else if (expression instanceof ImplictConversionExpression) {
      const temporary = env.generateValueOfType(expression.to);
      this.compileImplictConversionExpression(env, expression, temporary);
      return temporary.toCompilerDirectIRValue(env);
    } else if (expression instanceof VariableReferenceExpression) {
      return this.getIRValueOfVariableReferenceExpression(env, expression).toCompilerDirectIRValue(env);
    } else if (expression instanceof IdentifierCallExpression) {
      const temporary = env.generateValueOfType(expression.forceType());
      this.compileIdentifierCallExpression(env, expression, temporary);
      return temporary.toCompilerDirectIRValue(env);
    } else if (expression instanceof ConstructorCallExpression) {
      const temporary = env.generateValueOfType(expression.forceType());
      this.compileConstructorCallExpression(env, expression, temporary);
      return temporary.toCompilerDirectIRValue(env);
    } else if (expression instanceof MemberReferenceExpression) {
      const type = expression.lhs.forceType();
      if (type instanceof StructType) {
        const lhs = this.getExpressionAsValue(env, expression.lhs);
        return this.getStructMemberAsValue(env, lhs.getAsIRValue(), expression.memberToken.content);
      } else if (type instanceof ClassType) {
        const lhs = this.getExpressionAsValue(env, expression.lhs);
        return this.getClassMemberAsValue(env, lhs.getAsIRValue(), expression.memberToken.content);
      } else if (type instanceof StringType) {
        const lhs = this.getExpressionAsValue(env, expression.lhs).getAsIRValue();
        const memberName = expression.memberToken.content;
        if (memberName === "length") {
          const irValue = lhs.irVariables[type.lengthIndex];
          const index = env.values.length;
          const memberType = type.typeOfMember(memberName);
          if (memberType === undefined) {
            throw new Error();
          }
          const value = new IRValue(index, [irValue], memberType);
          return value.toCompilerDirectIRValue(env);
        }
      } else {
        throw new Error();
      }
    } else if (expression instanceof MemberCallExpression) {
      const temporary = env.generateValueOfType(expression.forceType());
      this.compileMemberCallExpression(env, expression, temporary);
      return temporary.toCompilerDirectIRValue(env);
    }
    throw new Error();
  }

  private compileIdentifierCallExpression(env: IRFunctionCompilationEnvironment, expression: IdentifierCallExpression, target: IRValue | undefined) {
    const lhs = expression.lhs;
    const entry = lhs.entry;
    if (entry === undefined) {
      throw new Error();
    }
    const entryType = entry.entryType;
    if (entryType === VariableScopeEntryType.globalUnboundFunction) {
      this.compileUnboundFunctionCall(env, entry, expression.args, target);
    } else {
      const value = this.getExpressionAsValue(env, expression.lhs);
      this.compileFunctionPointerCall(env, value.getAsIRValue(), expression.args, target);
    }
  }
  private compileFunctionPointerCall(env: IRFunctionCompilationEnvironment, fn: IRValue, args: Expression[], target: IRValue | undefined) {
    const type = fn.type as FunctionType;
    const arity = args.length;
    const irargs = args.map((arg) => this.getExpressionAsValue(env, arg).getAsIRValue());
    this.compileIndirectCall(env, type, fn.irVariables[0], undefined, irargs, target);
  }
  private compileMemberCallExpression(env: IRFunctionCompilationEnvironment, expression: MemberCallExpression, target: IRValue | undefined) {
    const type = expression.lhs.forceType();
    const methodName = expression.memberToken.content;
    const arity = expression.args.length;
    const lhs = this.getExpressionAsValue(env, expression.lhs);
    const args = expression.args.map((arg) => this.getExpressionAsValue(env, arg).getAsIRValue());
    this.compileMemberCall(env, lhs.getAsIRValue(), type, methodName, arity, args, target);
  }
  private compileMemberCall(env: IRFunctionCompilationEnvironment, lhs: IRValue, type: IType, method: string, arity: number, args: IRValue[], target: IRValue | undefined) {
    const irName = this.getMethodFunctionName(type, method, arity);
    this.compileCall(env, irName, lhs, args, target);
  }
  private compileCall(env: IRFunctionCompilationEnvironment, name: string, thisArg: IRValue | undefined, args: IRValue[], target: IRValue | undefined) {
    const irArgs: number[] = [];
    if (thisArg !== undefined) {
      irArgs.push(...thisArg.irVariables);
    }
    for (const arg of args) {
      irArgs.push(...arg.irVariables);
    }
    const irTarget = target ? target.irVariables : [];
    env.writeStatement([IR.InstructionType.call, name, irTarget, irArgs]);
  }
  private compileIndirectCall(env: IRFunctionCompilationEnvironment, fnType: FunctionType, fn: number, thisArg: IRValue | undefined, args: IRValue[], target: IRValue | undefined) {
    const irArgs: number[] = [];
    if (thisArg !== undefined) {
      irArgs.push(...thisArg.irVariables);
    }
    for (const arg of args) {
      irArgs.push(...arg.irVariables);
    }
    const irTarget = target ? target.irVariables : [];
    env.writeStatement([IR.InstructionType.callFunctionPointer, fnType.irFunctionType, fn, irTarget, irArgs]);
  }
  private compileImplictConversionExpression(env: IRFunctionCompilationEnvironment, expression: ImplictConversionExpression, target: IRValue) {
    const fromType = expression.from;
    const toType = expression.to;
    if (fromType instanceof NativeIntegerType && toType instanceof NativeIntegerType) {
      const value = this.getExpressionAsValue(env, expression.value);
      const [targetIRVariable] = target.irVariables;
      const [valueIRVariable] = value.getAsIRValue().irVariables;
      const [fromIRType] = fromType.irVariableTypes();
      const [toIRType] = toType.irVariableTypes();
      if (fromIRType === toIRType) {
        env.writeStatement([IR.InstructionType.copy, targetIRVariable, valueIRVariable]);
        // env.writeStatement([IR.InstructionType.phi, targetIRVariable, [valueIRVariable]]);
      } else {
        env.writeStatement([IR.InstructionType.convert, targetIRVariable, valueIRVariable, toType.irVariableTypes()[0]]);
      }
    }
  }
  private compileBinaryOperatorExpression(env: IRFunctionCompilationEnvironment, binaryOperatorExpression: BinaryOperatorExpression, target: IRValue | undefined) {
    const lhsType = binaryOperatorExpression.lhs.forceType();
    const rhsType = binaryOperatorExpression.rhs.forceType();
    const resultType = binaryOperatorExpression.forceType();
    const operator = binaryOperatorExpression.operator.content;
    if (lhsType instanceof NativeIntegerType && lhsType.equals(rhsType) && lhsType.equals(resultType)) {
      if (operator === "+") {
        if (target === undefined) {
          this.compileExpression(env, binaryOperatorExpression.lhs);
          this.compileExpression(env, binaryOperatorExpression.rhs);
          return;
        }
        const lhsValue = this.getExpressionAsValue(env, binaryOperatorExpression.lhs);
        const rhsValue = this.getExpressionAsValue(env, binaryOperatorExpression.rhs);
        const [lhsIRVariable] = lhsValue.getAsIRValue().irVariables;
        const [rhsIrVariable] = rhsValue.getAsIRValue().irVariables;
        const [targetVariable] = target.irVariables;
        env.writeStatement([IR.InstructionType.add, targetVariable, lhsIRVariable, rhsIrVariable]);
        return;
      } else if (operator === "-") {
        if (target === undefined) {
          this.compileExpression(env, binaryOperatorExpression.lhs);
          this.compileExpression(env, binaryOperatorExpression.rhs);
          return;
        }
        const lhsValue = this.getExpressionAsValue(env, binaryOperatorExpression.lhs);
        const rhsValue = this.getExpressionAsValue(env, binaryOperatorExpression.rhs);
        const [lhsIRVariable] = lhsValue.getAsIRValue().irVariables;
        const [rhsIrVariable] = rhsValue.getAsIRValue().irVariables;
        const [targetVariable] = target.irVariables;
        env.writeStatement([IR.InstructionType.subtract, targetVariable, lhsIRVariable, rhsIrVariable]);
        return;
      } else if (operator === "*") {
        if (target === undefined) {
          this.compileExpression(env, binaryOperatorExpression.lhs);
          this.compileExpression(env, binaryOperatorExpression.rhs);
          return;
        }
        const lhsValue = this.getExpressionAsValue(env, binaryOperatorExpression.lhs);
        const rhsValue = this.getExpressionAsValue(env, binaryOperatorExpression.rhs);
        const [lhsIRVariable] = lhsValue.getAsIRValue().irVariables;
        const [rhsIrVariable] = rhsValue.getAsIRValue().irVariables;
        const [targetVariable] = target.irVariables;
        env.writeStatement([IR.InstructionType.multiply, targetVariable, lhsIRVariable, rhsIrVariable]);
        return;
      } else if (operator === "/") {
        if (target === undefined) {
          this.compileExpression(env, binaryOperatorExpression.lhs);
          this.compileExpression(env, binaryOperatorExpression.rhs);
          return;
        }
        const lhsValue = this.getExpressionAsValue(env, binaryOperatorExpression.lhs);
        const rhsValue = this.getExpressionAsValue(env, binaryOperatorExpression.rhs);
        const [lhsIRVariable] = lhsValue.getAsIRValue().irVariables;
        const [rhsIrVariable] = rhsValue.getAsIRValue().irVariables;
        const [targetVariable] = target.irVariables;
        env.writeStatement([IR.InstructionType.divide, targetVariable, lhsIRVariable, rhsIrVariable]);
        return;
      } else if (operator === "<") {
        if (target === undefined) {
          this.compileExpression(env, binaryOperatorExpression.lhs);
          this.compileExpression(env, binaryOperatorExpression.rhs);
          return;
        }
        const lhsValue = this.getExpressionAsValue(env, binaryOperatorExpression.lhs);
        const rhsValue = this.getExpressionAsValue(env, binaryOperatorExpression.rhs);
        const [lhsIRVariable] = lhsValue.getAsIRValue().irVariables;
        const [rhsIrVariable] = rhsValue.getAsIRValue().irVariables;
        const [targetVariable] = target.irVariables;
        env.writeStatement([IR.InstructionType.less, targetVariable, lhsIRVariable, rhsIrVariable]);
        return;
      } else if (operator === ">") {
        if (target === undefined) {
          this.compileExpression(env, binaryOperatorExpression.lhs);
          this.compileExpression(env, binaryOperatorExpression.rhs);
          return;
        }
        const lhsValue = this.getExpressionAsValue(env, binaryOperatorExpression.lhs);
        const rhsValue = this.getExpressionAsValue(env, binaryOperatorExpression.rhs);
        const [lhsIRVariable] = lhsValue.getAsIRValue().irVariables;
        const [rhsIrVariable] = rhsValue.getAsIRValue().irVariables;
        const [targetVariable] = target.irVariables;
        env.writeStatement([IR.InstructionType.greater, targetVariable, lhsIRVariable, rhsIrVariable]);
        return;
      } else if (operator === "<=") {
        if (target === undefined) {
          this.compileExpression(env, binaryOperatorExpression.lhs);
          this.compileExpression(env, binaryOperatorExpression.rhs);
          return;
        }
        const lhsValue = this.getExpressionAsValue(env, binaryOperatorExpression.lhs);
        const rhsValue = this.getExpressionAsValue(env, binaryOperatorExpression.rhs);
        const [lhsIRVariable] = lhsValue.getAsIRValue().irVariables;
        const [rhsIrVariable] = rhsValue.getAsIRValue().irVariables;
        const [targetVariable] = target.irVariables;
        env.writeStatement([IR.InstructionType.lessEqual, targetVariable, lhsIRVariable, rhsIrVariable]);
        return;
      } else if (operator === ">=") {
        if (target === undefined) {
          this.compileExpression(env, binaryOperatorExpression.lhs);
          this.compileExpression(env, binaryOperatorExpression.rhs);
          return;
        }
        const lhsValue = this.getExpressionAsValue(env, binaryOperatorExpression.lhs);
        const rhsValue = this.getExpressionAsValue(env, binaryOperatorExpression.rhs);
        const [lhsIRVariable] = lhsValue.getAsIRValue().irVariables;
        const [rhsIrVariable] = rhsValue.getAsIRValue().irVariables;
        const [targetVariable] = target.irVariables;
        env.writeStatement([IR.InstructionType.greaterEqual, targetVariable, lhsIRVariable, rhsIrVariable]);
        return;
      } else if (operator === "==") {
        if (target === undefined) {
          this.compileExpression(env, binaryOperatorExpression.lhs);
          this.compileExpression(env, binaryOperatorExpression.rhs);
          return;
        }
        const lhsValue = this.getExpressionAsValue(env, binaryOperatorExpression.lhs);
        const rhsValue = this.getExpressionAsValue(env, binaryOperatorExpression.rhs);
        const [lhsIRVariable] = lhsValue.getAsIRValue().irVariables;
        const [rhsIrVariable] = rhsValue.getAsIRValue().irVariables;
        const [targetVariable] = target.irVariables;
        env.writeStatement([IR.InstructionType.equal, targetVariable, lhsIRVariable, rhsIrVariable]);
        return;
      } else if (operator === "!=") {
        if (target === undefined) {
          this.compileExpression(env, binaryOperatorExpression.lhs);
          this.compileExpression(env, binaryOperatorExpression.rhs);
          return;
        }
        const lhsValue = this.getExpressionAsValue(env, binaryOperatorExpression.lhs);
        const rhsValue = this.getExpressionAsValue(env, binaryOperatorExpression.rhs);
        const [lhsIRVariable] = lhsValue.getAsIRValue().irVariables;
        const [rhsIrVariable] = rhsValue.getAsIRValue().irVariables;
        const [targetVariable] = target.irVariables;
        env.writeStatement([IR.InstructionType.notEqual, targetVariable, lhsIRVariable, rhsIrVariable]);
        return;
      }
    }
    throw new Error("Custom binary operators are not allowed.");
  }
  private compilePostfixUnaryOperatorExpression(_env: IRFunctionCompilationEnvironment, _postfixUnaryOperatorExpression: PostfixUnaryOperatorExpression, _target: IRValue | undefined) {

  }
  private compilePrefixUnaryOperatorExpression(_env: IRFunctionCompilationEnvironment, _prefixUnaryOperatorExpreession: PrefixUnaryOperatorExpression, _target: IRValue | undefined) {

  }
  private compileUnboundFunctionCall(env: IRFunctionCompilationEnvironment, entry: VariableScopeEntry, args: Expression[], target: IRValue | undefined) {

    const irVariableArray: number[] = [];
    for (const arg of args) {
      const argValue = this.getExpressionAsValue(env, arg);
      irVariableArray.push(...argValue.getAsIRValue().irVariables);
    }
    const entryType = entry.type;
    if (entryType === undefined) {
      throw new Error();
    }
    if (!(entryType instanceof FunctionType)) {
      throw new Error();
    }
    const resultType = entryType.result;
    const targetValue = target || env.generateValueOfType(resultType);
    const targetVariables = targetValue.irVariables;
    const functionName = this.getUnboundFunctionName(entry.declaration as UnboundFunctionDeclaration);
    env.writeStatement([IR.InstructionType.call, functionName, targetVariables, irVariableArray]);
  }
  private compileIntegerLiteralExpression(env: IRFunctionCompilationEnvironment, integerLiteralExpression: IntegerLiteralExpression, target: IRValue) {
    const integerLiteralToken = integerLiteralExpression.integerLiteralToken;
    const [irTargetVariable] = target.irVariables;
    env.writeStatement([IR.InstructionType.setToConstant, irTargetVariable, parseInt(integerLiteralToken.content, 10)]);
  }
  private compileFloatingPointLiteralExpression(env: IRFunctionCompilationEnvironment, floatingPointLiteralExpression: FloatingPointLiteralExpression, target: IRValue) {
    const floatingPointToken = floatingPointLiteralExpression.floatingPointLiteralToken;
    const [irTargetVariable] = target.irVariables;
    env.writeStatement([IR.InstructionType.setToConstant, irTargetVariable, parseFloat(floatingPointToken.content)]);
  }
  private compileStringLiteralExpression(env: IRFunctionCompilationEnvironment, stringLiteralExpression: StringLiteralExpression, target: IRValue) {
    const stringLiteralToken = stringLiteralExpression.stringLiteralToken;
    const str = JSON.parse(stringLiteralToken.content);
    const length = str.length;
    const dataSegment = this.getDataSegmentIndexForConstantString(str);
    const [ptrVariable, lengthVariable] = target.irVariables;
    env.writeStatement([IR.InstructionType.setToDataSegment, ptrVariable, dataSegment]);
    env.writeStatement([IR.InstructionType.setToConstant, lengthVariable, length]);
  }
  private getStructMemberAsValue(env: IRFunctionCompilationEnvironment, struct: IRValue, propertyName: string): CompilerDirectIRValue {
    const structType = struct.type as StructType;
    const propertyIndices = structType.propertyIrVariableIndexMapping.get(propertyName);
    const propertyType = structType.propertyTypeMap.get(propertyName);
    if (propertyType === undefined) {
      throw new Error();
    }
    if (propertyIndices === undefined) {
      throw new Error();
    }
    const valueIndex = env.values.length;
    const indicies = propertyIndices.map((index) => struct.irVariables[index]);
    const propertyValue = new IRValue(valueIndex, indicies, propertyType);
    return propertyValue.toCompilerDirectIRValue(env);
  }
  private getClassMemberAsValue(env: IRFunctionCompilationEnvironment, classInstance: IRValue, propertyName: string): CompilerPointerIRValue {
    const lhsType = classInstance.type as ClassType;
    const memory = lhsType.instanceMemoryMapData.get(propertyName);
    if (memory === undefined) {
      throw new Error();
    }
    const memberType = lhsType.typeOfMember(propertyName);
    if (memberType === undefined) {
      throw new Error();
    }
    return new CompilerPointerIRValue(env, memberType, classInstance.toCompilerDirectIRValue(env), memory.baseOffset);
  }
}
