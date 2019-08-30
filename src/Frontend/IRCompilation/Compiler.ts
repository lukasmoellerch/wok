import * as IR from "../../IR/AST";
import { TypedArrayBytestreamConsumer } from "../../WASM/Encoding/TypedArrayBytestreamConsumer";
import { encodeUTF8String } from "../../WASM/Encoding/Utils";
import { ILValue } from "../AST/AST";
import { AssignmentStatement } from "../AST/Nodes/AssignmentStatement";
import { BinaryOperatorExpression } from "../AST/Nodes/BinaryOperatorExpression";
import { Block } from "../AST/Nodes/Block";
import { ConstantDeclaration } from "../AST/Nodes/ConstantDeclaration";
import { Expression } from "../AST/Nodes/Expression";
import { ExpressionWrapper } from "../AST/Nodes/ExpressionWrapper";
import { FloatingPointLiteralExpression } from "../AST/Nodes/FloatingPointLiteralExpression";
import { IdentifierCallExpression } from "../AST/Nodes/IdentifierCallExpression";
import { IfStatement } from "../AST/Nodes/IfStatement";
import { ImplictConversionExpression } from "../AST/Nodes/ImplictConversionExpression";
import { IntegerLiteralExpression } from "../AST/Nodes/IntegerLiteralExpression";
import { PostfixUnaryOperatorExpression } from "../AST/Nodes/PostfixUnaryOperatorExpression";
import { PrefixUnaryOperatorExpression } from "../AST/Nodes/PrefixUnaryOperatorExpression";
import { SourceFile } from "../AST/Nodes/SourceFile";
import { Statement } from "../AST/Nodes/Statement";
import { StringLiteralExpression } from "../AST/Nodes/StringLiteralExpression";
import { UnboundFunctionDeclaration } from "../AST/Nodes/UnboundFunctionDeclaration";
import { VariableDeclaration } from "../AST/Nodes/VariableDeclaration";
import { VariableReferenceExpression } from "../AST/Nodes/VariableReferenceExpression";
import { WhileStatement } from "../AST/Nodes/WhileStatement";
import { TypeTreeNode } from "../Type Scope/TypeScope";
import { FunctionType } from "../Type/FunctionType";
import { NativeIntegerType } from "../Type/NativeType";
import { IType } from "../Type/Type";
import { VariableScopeEntry, VariableScopeEntryType } from "../VariableScope/VariableScope";
export class IRValue {
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
export class IRFunctionCompilationEnvironment {
  public localTypes: IR.Type[];
  public values: IRValue[] = [];
  public irVariableIndex: number = 0;
  public entryIndexValueIndexMapping: Map<number, number> = new Map();
  public declaration: IR.IInternalFunctionDeclaration;
  public irFunction: IR.IInternalFunctionDefinition;
  public blockArrayStack: IR.Block[][];
  constructor(functionIdentifier: string, functionType: FunctionType) {
    const irFunctionType = functionType.irFunctionType;
    this.declaration = {
      identifier: functionIdentifier,
      type: irFunctionType,
      inlinable: false,
      exportedAs: undefined,
      tableElement: false,
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
  public constantStringDataSegmentMapping: Map<string, number> = new Map();
  constructor(private rootTypeTreeNode: TypeTreeNode) { }
  public getDataSegmentIndexForConstantString(str: string): number {
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
  public compileSourceFile(sourceFile: SourceFile) {
    for (const topLevelDeclaration of sourceFile.topLevelDeclarations) {
      if (topLevelDeclaration instanceof UnboundFunctionDeclaration) {
        this.compileUnboundFunctionDeclaration(topLevelDeclaration);
      }
    }
  }
  public compileUnboundFunctionDeclaration(unboundFunctionDeclaration: UnboundFunctionDeclaration) {
    const foreignParameters = unboundFunctionDeclaration.decoratorMap.get("foreign");
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
      const externalFunctionDeclaration: IR.IExternalFunctionDeclaration = {
        identifier: unboundFunctionDeclaration.name.content,
        externalName,
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
    const identifier = unboundFunctionDeclaration.name.content;
    const functionType = unboundFunctionDeclaration.getFunctionType(this.rootTypeTreeNode);
    const environment = new IRFunctionCompilationEnvironment(identifier, functionType);
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
    environment.declaration.tableElement = true;

    this.compilationUnit.internalFunctionDeclarations.push(environment.declaration);
    this.compilationUnit.functionCode.push(environment.irFunction);
  }
  public compileBlock(env: IRFunctionCompilationEnvironment, block: Block) {
    for (const statement of block.statements) {
      this.compileStatement(env, statement);
    }
  }
  public compileStatement(env: IRFunctionCompilationEnvironment, statement: Statement) {
    if (statement instanceof ExpressionWrapper) {
      this.compileExpressionWrapper(env, statement);
    } else if (statement instanceof IfStatement) {
      this.compileIfStatement(env, statement);
    } else if (statement instanceof WhileStatement) {
      this.compileWhileStatement(env, statement);
    } else if (statement instanceof VariableDeclaration) {
      this.compileVariableDeclaration(env, statement);
    } else if (statement instanceof ConstantDeclaration) {
      this.compileConstantDeclaration(env, statement);
    } else if (statement instanceof AssignmentStatement) {
      this.compileAssignmentStatement(env, statement);
    }
  }
  public compileExpressionWrapper(env: IRFunctionCompilationEnvironment, expressionWrapper: ExpressionWrapper) {
    const expression = expressionWrapper.expression;
    if (expression instanceof Expression) {
      this.getExpressionAsValue(env, expression);
    } else if (expression instanceof AssignmentStatement) {
      this.compileAssignmentStatement(env, expression);
    }
  }
  public compileIfStatement(env: IRFunctionCompilationEnvironment, ifStatement: IfStatement) {
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
  public compileWhileStatement(env: IRFunctionCompilationEnvironment, whileStatement: WhileStatement) {
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
  public compileVariableDeclaration(env: IRFunctionCompilationEnvironment, variableDeclaration: VariableDeclaration) {
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
  public compileConstantDeclaration(env: IRFunctionCompilationEnvironment, constantDeclaration: ConstantDeclaration) {
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
  public compileAssignmentStatement(env: IRFunctionCompilationEnvironment, assignmentStatement: AssignmentStatement) {
    const lvalue = assignmentStatement.target;
    const value = this.getIRValueOfLValue(env, lvalue);
    const expression = assignmentStatement.value;
    this.compileExpression(env, expression, value);
  }
  public getIRValueOfLValue(env: IRFunctionCompilationEnvironment, lValue: ILValue): IRValue {
    if (lValue instanceof VariableReferenceExpression) {
      return this.getIRValueOfVariableReferenceExpression(env, lValue);
    }
    throw new Error("Not implemented");
  }
  public getIRValueOfVariableReferenceExpression(env: IRFunctionCompilationEnvironment, variableReferenceExpression: VariableReferenceExpression): IRValue {
    const entry = variableReferenceExpression.entry;
    if (entry === undefined) {
      throw new Error("Variable has no entry associated with it");
    }
    const value = env.getValueForEntry(entry);
    return value;
  }
  public compileExpression(env: IRFunctionCompilationEnvironment, expression: Expression, target?: IRValue) {
    if (expression instanceof BinaryOperatorExpression) {
      this.compileBinaryOperatorExpression(env, expression, target);
    } else if (expression instanceof PostfixUnaryOperatorExpression) {
      this.compilePostfixUnaryOperatorExpression(env, expression, target);
    } else if (expression instanceof PrefixUnaryOperatorExpression) {
      this.compilePrefixUnaryOperatorExpression(env, expression, target);
    } else if (expression instanceof IntegerLiteralExpression) {
      if (target === undefined) {
        return;
      }
      this.compileIntegerLiteralExpression(env, expression, target);
    } else if (expression instanceof FloatingPointLiteralExpression) {
      if (target === undefined) {
        return;
      }
      this.compileFloatingPointLiteralExpression(env, expression, target);
    } else if (expression instanceof StringLiteralExpression) {
      if (target === undefined) {
        return;
      }
      this.compileStringLiteralExpression(env, expression, target);
    } else if (expression instanceof VariableReferenceExpression) {
      if (target === undefined) {
        return;
      }
      const irValue = this.getIRValueOfVariableReferenceExpression(env, expression);
      let i = 0;
      const targetIrVariables = target.irVariables;
      const valueIrVariables = irValue.irVariables;
      while (i < targetIrVariables.length) {
        env.writeStatement([IR.InstructionType.copy, targetIrVariables[i], valueIrVariables[i]]);
        i++;
      }
    } else if (expression instanceof ImplictConversionExpression) {
      if (target === undefined) {
        this.compileExpression(env, expression.value);
        return;
      }
      this.compileImplictConversionExpression(env, expression, target);
    } else if (expression instanceof IdentifierCallExpression) {
      this.compileIdentifierCallExpression(env, expression, target);
    }
  }
  public getExpressionAsValue(env: IRFunctionCompilationEnvironment, expression: Expression): IRValue {
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
    }
    throw new Error();
  }
  public compileIdentifierCallExpression(env: IRFunctionCompilationEnvironment, expression: IdentifierCallExpression, target: IRValue | undefined) {
    const lhs = expression.lhs;
    const entry = lhs.entry;
    if (entry === undefined) {
      throw new Error();
    }
    const entryType = entry.entryType;
    if (entryType === VariableScopeEntryType.globalUnboundFunction) {
      this.compileUnboundFunctionCall(env, entry, expression.args, target);
    } else {
      throw new Error();
    }
  }
  public compileImplictConversionExpression(env: IRFunctionCompilationEnvironment, expression: ImplictConversionExpression, target: IRValue) {
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
      } else {
        env.writeStatement([IR.InstructionType.convert, targetIRVariable, valueIRVariable, toType.irVariableTypes()[0]]);
      }
    }
  }
  public compileBinaryOperatorExpression(env: IRFunctionCompilationEnvironment, binaryOperatorExpression: BinaryOperatorExpression, target: IRValue | undefined) {
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
      }
    }
    throw new Error("Custom binary operators are not allowed.");
  }
  public compilePostfixUnaryOperatorExpression(_env: IRFunctionCompilationEnvironment, _postfixUnaryOperatorExpression: PostfixUnaryOperatorExpression, _target: IRValue | undefined) {

  }
  public compilePrefixUnaryOperatorExpression(_env: IRFunctionCompilationEnvironment, _prefixUnaryOperatorExpreession: PrefixUnaryOperatorExpression, _target: IRValue | undefined) {

  }
  public compileUnboundFunctionCall(env: IRFunctionCompilationEnvironment, entry: VariableScopeEntry, args: Expression[], target: IRValue | undefined) {

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
    const functionName = entry.str;
    env.writeStatement([IR.InstructionType.call, functionName, targetVariables, irVariableArray]);
  }
  public compileIntegerLiteralExpression(env: IRFunctionCompilationEnvironment, integerLiteralExpression: IntegerLiteralExpression, target: IRValue) {
    const integerLiteralToken = integerLiteralExpression.integerLiteralToken;
    const [irTargetVariable] = target.irVariables;
    env.writeStatement([IR.InstructionType.setToConstant, irTargetVariable, parseInt(integerLiteralToken.content, 10)]);
  }
  public compileFloatingPointLiteralExpression(env: IRFunctionCompilationEnvironment, floatingPointLiteralExpression: FloatingPointLiteralExpression, target: IRValue) {
    const floatingPointToken = floatingPointLiteralExpression.floatingPointLiteralToken;
    const [irTargetVariable] = target.irVariables;
    env.writeStatement([IR.InstructionType.setToConstant, irTargetVariable, parseFloat(floatingPointToken.content)]);
  }
  public compileStringLiteralExpression(env: IRFunctionCompilationEnvironment, stringLiteralExpression: StringLiteralExpression, target: IRValue) {
    const stringLiteralToken = stringLiteralExpression.stringLiteralToken;
    const str = JSON.parse(stringLiteralToken.content);
    const length = str.length;
    const dataSegment = this.getDataSegmentIndexForConstantString(str);
    const [ptrVariable, lengthVariable] = target.irVariables;
    env.writeStatement([IR.InstructionType.setToDataSegment, ptrVariable, dataSegment]);
    env.writeStatement([IR.InstructionType.setToConstant, lengthVariable, length]);
  }
}
