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
import { Statement } from "../AST/Nodes/Statement";
import { StringLiteralExpression } from "../AST/Nodes/StringLiteralExpression";
import { UnboundFunctionDeclaration } from "../AST/Nodes/UnboundFunctionDeclaration";
import { VariableDeclaration } from "../AST/Nodes/VariableDeclaration";
import { VariableReferenceExpression } from "../AST/Nodes/VariableReferenceExpression";
import { WhileStatement } from "../AST/Nodes/WhileStatement";
import { TypeTreeNode } from "../Type Scope/TypeScope";
import { FunctionType } from "../Type/FunctionType";
import { NativeIntegerType, PointerType, StringType } from "../Type/NativeType";
import { StructType } from "../Type/StructType";
import { IType } from "../Type/Type";
import { VariableScopeEntry, VariableScopeEntryType } from "../VariableScope/VariableScope";
import { CompileConstructor, CompileMethod, CompileOperator, CompilerTask, CompileUnboundFunctionTask } from "./CompilerTask";
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
  private generateStoreInstructions(env: IRFunctionCompilationEnvironment, type: IType, value: IRValue, ptr: IRValue) {
    const ptrVariable = ptr.irVariables[0];
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
  private generateLoadInstructions(env: IRFunctionCompilationEnvironment, type: IType, target: IRValue, ptr: IRValue) {
    const ptrVariable = ptr.irVariables[0];
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
        this.generateStoreInstructions(environment, type.stored, arg, thisValue);
      } else if (name === "load") {
        // this argument
        const thisValue = environment.generateValueOfType(type);
        const resultValue = environment.generateValueOfType(type.stored);
        this.generateLoadInstructions(environment, type.stored, resultValue, thisValue);
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
    }
    environment.finalize();

    environment.declaration.exportedAs = undefined;
    environment.declaration.inlinable = false;
    environment.declaration.tableElement = true;

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
    const ifElse = env.ifElseBlock(condition);
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
    const array = env.ifBlock(condition);
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
    const [irVariable] = condition.irVariables;
    env.writeStatement([IR.InstructionType.breakIfFalse, irVariable]);
    const loopBlock = env.loopBlock();
    env.pushBlockArray(loopBlock);
    this.compileBlock(env, whileStatement.block);
    const loopRepeatCondition = this.getExpressionAsValue(env, expression);
    const [loopIRVariable] = loopRepeatCondition.irVariables;
    env.writeStatement([IR.InstructionType.breakIf, loopIRVariable]);
    env.popBlock();
    env.popBlock();
  }
  private compileVariableDeclaration(env: IRFunctionCompilationEnvironment, variableDeclaration: VariableDeclaration) {
    const entry = variableDeclaration.entry;
    if (entry === undefined) {
      throw new Error();
    }
    const expressionWrapper = variableDeclaration.value;
    const expression = expressionWrapper.expression;
    if (expression instanceof Expression) {
      const value = env.getValueForEntry(entry);
      this.compileExpression(env, expression, value);
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
      const value = env.getValueForEntry(entry);
      this.compileExpression(env, expression, value);
    }
  }
  private compileAssignmentStatement(env: IRFunctionCompilationEnvironment, assignmentStatement: AssignmentStatement) {
    const lvalue = assignmentStatement.target;
    const value = this.getIRValueOfLValue(env, lvalue);
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
      env.writeStatement([IR.InstructionType.return, value.irVariables]);
    } else {
      env.writeStatement([IR.InstructionType.return, []]);
    }
  }
  private getIRValueOfLValue(env: IRFunctionCompilationEnvironment, lValue: ILValue): IRValue {
    if (lValue instanceof VariableReferenceExpression) {
      return this.getIRValueOfVariableReferenceExpression(env, lValue);
    } else if (lValue instanceof MemberReferenceExpression) {
      const lhsType = lValue.lhs.forceType();
      if (lhsType instanceof StructType) {
        const lhs = this.getExpressionAsValue(env, lValue.lhs);
        return this.getStructMemberAsValue(env, lhs, lValue.memberToken.content);
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
      const value = env.getValueForEntry(entry);
      return value;
    }

  }
  private compileExpression(env: IRFunctionCompilationEnvironment, expression: Expression, target?: IRValue) {
    if (expression instanceof BinaryOperatorExpression) {
      this.compileBinaryOperatorExpression(env, expression, target);
      return;
    } else if (expression instanceof PostfixUnaryOperatorExpression) {
      this.compilePostfixUnaryOperatorExpression(env, expression, target);
      return;
    } else if (expression instanceof PrefixUnaryOperatorExpression) {
      this.compilePrefixUnaryOperatorExpression(env, expression, target);
      return;
    } else if (expression instanceof IntegerLiteralExpression) {
      if (target === undefined) {
        return;
      }
      this.compileIntegerLiteralExpression(env, expression, target);
      return;
    } else if (expression instanceof FloatingPointLiteralExpression) {
      if (target === undefined) {
        return;
      }
      this.compileFloatingPointLiteralExpression(env, expression, target);
      return;
    } else if (expression instanceof StringLiteralExpression) {
      if (target === undefined) {
        return;
      }
      this.compileStringLiteralExpression(env, expression, target);
      return;
    } else if (expression instanceof VariableReferenceExpression) {
      this.compileVariableReferenceExpression(env, expression, target);
      return;
    } else if (expression instanceof ImplictConversionExpression) {
      if (target === undefined) {
        this.compileExpression(env, expression.value);
        return;
      }
      this.compileImplictConversionExpression(env, expression, target);
      return;
    } else if (expression instanceof IdentifierCallExpression) {
      this.compileIdentifierCallExpression(env, expression, target);
      return;
    } else if (expression instanceof ConstructorCallExpression) {
      const constructedType = expression.type;
      if (constructedType instanceof StructType) {
        if (target === undefined && constructedType.constructorDeclaration === undefined) {
          return;
        }
      }
      this.compileConstructorCallExpression(env, expression, target);
      return;
    } else if (expression instanceof MemberReferenceExpression) {
      // TODO: Use getStructMemberAsValue
      const type = expression.lhs.forceType();
      if (type instanceof StructType) {
        const lhs = this.getExpressionAsValue(env, expression.lhs);
        if (target === undefined) {
          return;
        }
        const lhsIRVariables = target.irVariables;
        const indices = type.propertyIrVariableIndexMapping.get(expression.memberToken.content);
        if (indices === undefined) {
          throw new Error();
        }
        const rhsIRVariables = indices.map(index => lhs.irVariables[index]);
        let index = 0;
        for (const lhsIRVariable of lhsIRVariables) {
          const rhsIRVariable = rhsIRVariables[index];
          env.writeStatement([IR.InstructionType.copy, lhsIRVariable, rhsIRVariable]);
          index++;
        }
        return;
      } else {
        throw new Error();
      }
    } else if (expression instanceof MemberCallExpression) {
      this.compileMemberCallExpression(env, expression, target);
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
      // TODO: Creater new target with proper type
      this.compileExpression(env, expression.args[0], target);
      return;
    }
    throw new Error();
    // TODO: Handle other constructable types
  }
  private getExpressionAsValue(env: IRFunctionCompilationEnvironment, expression: Expression): IRValue {
    if (expression instanceof BinaryOperatorExpression) {
      const temporary = env.generateValueOfType(expression.forceType());
      this.compileBinaryOperatorExpression(env, expression, temporary);
      return temporary;
    } else if (expression instanceof PostfixUnaryOperatorExpression) {
      const temporary = env.generateValueOfType(expression.forceType());
      this.compilePostfixUnaryOperatorExpression(env, expression, temporary);
      return temporary;
    } else if (expression instanceof PrefixUnaryOperatorExpression) {
      const temporary = env.generateValueOfType(expression.forceType());
      this.compilePrefixUnaryOperatorExpression(env, expression, temporary);
      return temporary;
    } else if (expression instanceof IntegerLiteralExpression) {
      const temporary = env.generateValueOfType(expression.forceType());
      this.compileIntegerLiteralExpression(env, expression, temporary);
      return temporary;
    } else if (expression instanceof StringLiteralExpression) {
      const temporary = env.generateValueOfType(expression.forceType());
      this.compileStringLiteralExpression(env, expression, temporary);
      return temporary;
    } else if (expression instanceof FloatingPointLiteralExpression) {
      const temporary = env.generateValueOfType(expression.forceType());
      this.compileFloatingPointLiteralExpression(env, expression, temporary);
      return temporary;
    } else if (expression instanceof ImplictConversionExpression) {
      const temporary = env.generateValueOfType(expression.to);
      this.compileImplictConversionExpression(env, expression, temporary);
      return temporary;
    } else if (expression instanceof VariableReferenceExpression) {
      return this.getIRValueOfVariableReferenceExpression(env, expression);
    } else if (expression instanceof IdentifierCallExpression) {
      const temporary = env.generateValueOfType(expression.forceType());
      this.compileIdentifierCallExpression(env, expression, temporary);
      return temporary;
    } else if (expression instanceof ConstructorCallExpression) {
      const temporary = env.generateValueOfType(expression.forceType());
      this.compileConstructorCallExpression(env, expression, temporary);
      return temporary;
    } else if (expression instanceof MemberReferenceExpression) {
      const type = expression.lhs.forceType();
      if (type instanceof StructType) {
        const lhs = this.getExpressionAsValue(env, expression.lhs);
        return this.getStructMemberAsValue(env, lhs, expression.memberToken.content);
      } else if (type instanceof StringType) {
        const lhs = this.getExpressionAsValue(env, expression.lhs);
        const memberName = expression.memberToken.content;
        if (memberName === "length") {
          const irValue = lhs.irVariables[type.lengthIndex];
          const index = env.values.length;
          const memberType = type.typeOfMember(memberName);
          if (memberType === undefined) {
            throw new Error();
          }
          const value = new IRValue(index, [irValue], memberType);
          return value;
        }
      } else {
        throw new Error();
      }
    } else if (expression instanceof MemberCallExpression) {
      const temporary = env.generateValueOfType(expression.forceType());
      this.compileMemberCallExpression(env, expression, temporary);
      return temporary;
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
      this.compileFunctionPointerCall(env, value, expression.args, target);
    }
  }
  private compileFunctionPointerCall(env: IRFunctionCompilationEnvironment, fn: IRValue, args: Expression[], target: IRValue | undefined) {
    const type = fn.type as FunctionType;
    const arity = args.length;
    const irargs = args.map((arg) => this.getExpressionAsValue(env, arg));
    this.compileIndirectCall(env, type, fn.irVariables[0], undefined, irargs, target);
  }
  private compileMemberCallExpression(env: IRFunctionCompilationEnvironment, expression: MemberCallExpression, target: IRValue | undefined) {
    const type = expression.lhs.forceType();
    const methodName = expression.memberToken.content;
    const arity = expression.args.length;
    const lhs = this.getExpressionAsValue(env, expression.lhs);
    const args = expression.args.map((arg) => this.getExpressionAsValue(env, arg));
    this.compileMemberCall(env, lhs, type, methodName, arity, args, target);
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
      const [valueIRVariable] = value.irVariables;
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
        const [lhsIRVariable] = lhsValue.irVariables;
        const [rhsIrVariable] = rhsValue.irVariables;
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
        const [lhsIRVariable] = lhsValue.irVariables;
        const [rhsIrVariable] = rhsValue.irVariables;
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
        const [lhsIRVariable] = lhsValue.irVariables;
        const [rhsIrVariable] = rhsValue.irVariables;
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
        const [lhsIRVariable] = lhsValue.irVariables;
        const [rhsIrVariable] = rhsValue.irVariables;
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
        const [lhsIRVariable] = lhsValue.irVariables;
        const [rhsIrVariable] = rhsValue.irVariables;
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
        const [lhsIRVariable] = lhsValue.irVariables;
        const [rhsIrVariable] = rhsValue.irVariables;
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
        const [lhsIRVariable] = lhsValue.irVariables;
        const [rhsIrVariable] = rhsValue.irVariables;
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
        const [lhsIRVariable] = lhsValue.irVariables;
        const [rhsIrVariable] = rhsValue.irVariables;
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
        const [lhsIRVariable] = lhsValue.irVariables;
        const [rhsIrVariable] = rhsValue.irVariables;
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
        const [lhsIRVariable] = lhsValue.irVariables;
        const [rhsIrVariable] = rhsValue.irVariables;
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
      irVariableArray.push(...argValue.irVariables);
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
  private getStructMemberAsValue(env: IRFunctionCompilationEnvironment, struct: IRValue, propertyName: string): IRValue {
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
    return propertyValue;
  }
}
