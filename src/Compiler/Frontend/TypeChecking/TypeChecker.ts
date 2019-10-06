import { ILValue } from "../AST/AST";
import { ASTWalker } from "../AST/ASTWalker";
import { TypeAttribute } from "../AST/Attributes/TypeAttribute";
import { ITypeCheckingType } from "../AST/ExpressionType";
import { AssignmentStatement } from "../AST/Nodes/AssignmentStatement";
import { BinaryOperatorExpression } from "../AST/Nodes/BinaryOperatorExpression";
import { ConstantDeclaration } from "../AST/Nodes/ConstantDeclaration";
import { ConstructorCallExpression } from "../AST/Nodes/ConstructorCallExpression";
import { Expression } from "../AST/Nodes/Expression";
import { ExtensionDeclaration } from "../AST/Nodes/ExtensionDeclaration";
import { FloatingPointLiteralExpression } from "../AST/Nodes/FloatingPointLiteralExpression";
import { FunctionArgumentDeclaration } from "../AST/Nodes/FunctionArgumentDeclaration";
import { IdentifierCallExpression } from "../AST/Nodes/IdentifierCallExpression";
import { IfElseStatement } from "../AST/Nodes/IfElseStatement";
import { IfStatement } from "../AST/Nodes/IfStatement";
import { IntegerLiteralExpression } from "../AST/Nodes/IntegerLiteralExpression";
import { MemberCallExpression } from "../AST/Nodes/MemberCallExpression";
import { MemberReferenceExpression } from "../AST/Nodes/MemberReferenceExpression";
import { PlaceholderExpression } from "../AST/Nodes/PlaceholderExpression";
import { PostfixUnaryOperatorExpression } from "../AST/Nodes/PostfixUnaryOperatorExpression";
import { PrefixUnaryOperatorExpression } from "../AST/Nodes/PrefixUnaryOperatorExpression";
import { ReturnStatement } from "../AST/Nodes/ReturnStatement";
import { StringLiteralExpression } from "../AST/Nodes/StringLiteralExpression";
import { VariableDeclaration } from "../AST/Nodes/VariableDeclaration";
import { VariableReferenceExpression } from "../AST/Nodes/VariableReferenceExpression";
import { WhileStatement } from "../AST/Nodes/WhileStatement";
import { CompilerError, MemberIsNotCallableError, OperatorNotDefinedForTypeError, TypeHasNoMemberCalledError, WritingToConstantError } from "../ErrorHandling/CompilerError";
import { TypeTreeNode } from "../Type Scope/TypeScope";
import { TypeCheckingFunctionType } from "../Type/FunctionType";
import { TypeCheckingNativeIntegerType, TypeCheckingStringType } from "../Type/NativeType";
import { StructType } from "../Type/StructType";
import { TypeCheckingVoidType } from "../Type/VoidType";
import { VariableScopeEntryType } from "../VariableScope/VariableScope";

export class TypeChecker extends ASTWalker {
  public errors: CompilerError[];
  public u8: ITypeCheckingType;
  public u16: ITypeCheckingType;
  public u32: ITypeCheckingType;
  public u64: ITypeCheckingType;
  public i8: ITypeCheckingType;
  public i16: ITypeCheckingType;
  public i32: ITypeCheckingType;
  public i64: ITypeCheckingType;
  public bool: ITypeCheckingType;
  public integer: ITypeCheckingType;
  public unsignedInteger: ITypeCheckingType;
  public string: ITypeCheckingType;
  public rootTypeTreeNode: TypeTreeNode;
  constructor(rootTypeTreeNode: TypeTreeNode, errors: CompilerError[]) {
    super();
    this.rootTypeTreeNode = rootTypeTreeNode;
    this.errors = errors;

    this.u8 = new TypeCheckingNativeIntegerType(rootTypeTreeNode, false, 1);
    this.u16 = new TypeCheckingNativeIntegerType(rootTypeTreeNode, false, 2);
    this.u32 = new TypeCheckingNativeIntegerType(rootTypeTreeNode, false, 4);
    this.u64 = new TypeCheckingNativeIntegerType(rootTypeTreeNode, false, 8);

    this.i8 = new TypeCheckingNativeIntegerType(rootTypeTreeNode, true, 1);
    this.i16 = new TypeCheckingNativeIntegerType(rootTypeTreeNode, true, 2);
    this.i32 = new TypeCheckingNativeIntegerType(rootTypeTreeNode, true, 4);
    this.i64 = new TypeCheckingNativeIntegerType(rootTypeTreeNode, true, 8);

    this.bool = this.u8;

    this.integer = this.i32;
    this.unsignedInteger = this.u32;

    this.string = new TypeCheckingStringType(rootTypeTreeNode);
  }
  protected walkExtensionDeclaration(_extensionDeclaration: ExtensionDeclaration) {
    return;
  }
  protected walkArgumentDeclaration(argumentDeclaration: FunctionArgumentDeclaration) {
    const entry = argumentDeclaration.entry;
    if (entry === undefined) {
      throw new Error();
    }
    entry.type = argumentDeclaration.type.type;
    super.walkArgumentDeclaration(argumentDeclaration);
  }
  protected walkIfStatement(ifStatement: IfStatement) {
    const expression = ifStatement.condition.expression;
    if (expression instanceof Expression) {
      this.checkExpression(expression, this.bool);
    }
    super.walkBlock(ifStatement.block);
  }
  protected walkIfElseStatmment(ifElseStatement: IfElseStatement) {
    const expression = ifElseStatement.condition.expression;
    if (expression instanceof Expression) {
      this.checkExpression(expression, this.bool);
    }
    super.walkBlock(ifElseStatement.trueBlock);
    super.walkBlock(ifElseStatement.falseBlocK);
  }
  protected walkWhileStatement(whileStatement: WhileStatement) {
    const expression = whileStatement.condition.expression;
    if (expression instanceof Expression) {
      this.checkExpression(expression, this.bool);
    }
    super.walkBlock(whileStatement.block);
  }
  protected walkExpression(expression: Expression) {
    this.checkExpression(expression);
  }
  protected walkVariableDeclaration(variableDeclaration: VariableDeclaration) {
    const hint = variableDeclaration.typeHint;
    const expression = variableDeclaration.value.expression;
    if (expression instanceof Expression) {
      this.checkExpression(expression, hint ? hint.type : undefined);
      const entry = variableDeclaration.entry;
      if (entry !== undefined) {
        entry.type = expression.type;
        variableDeclaration.setAttribute(new TypeAttribute(expression.forceType()));
      }
    }
  }
  protected walkConstantDeclaration(constantDeclaration: ConstantDeclaration) {
    const hint = constantDeclaration.typeHint;
    const expression = constantDeclaration.value.expression;
    if (expression instanceof Expression) {
      this.checkExpression(expression, hint ? hint.type : undefined);
      const entry = constantDeclaration.entry;
      if (entry !== undefined) {
        entry.type = expression.type;
        if (entry.type instanceof TypeCheckingVoidType || entry.type === undefined) {
          return;
        }
        constantDeclaration.setAttribute(new TypeAttribute(expression.forceType()));
      }
    }
  }
  protected walkReturnStatement(returnStatement: ReturnStatement) {
    // TODO: Check return type
    // TODO: Add stack for function declarations for return type checking
    // TODO: Check for void return type if no value is provided
    // TODO: Check if all paths in non-void functions returns a value
    const value = returnStatement.value;
    if (value === undefined) {
      return;
    }
    const expression = value.expression;
    if (expression === undefined) {
      return;
    }
    if (expression instanceof Expression) {
      this.checkExpression(expression);
    }
  }
  protected walkAssignmentStatement(assignmentStatement: AssignmentStatement) {
    this.checkLValue(assignmentStatement.target);
    const type = assignmentStatement.target.rhsType;
    this.checkExpression(assignmentStatement.value, type);
  }
  private checkLValue(lValue: ILValue) {
    if (lValue instanceof VariableReferenceExpression) {
      const entry = lValue.entry;
      if (entry === undefined) {
        return;
      }
      if (entry.entryType === VariableScopeEntryType.constant) {
        this.errors.push(new WritingToConstantError(lValue.variableToken.range, entry.str));
      }
      const type = entry.type;
      if (type !== undefined) {
        lValue.rhsType = type;
      }
    } else if (lValue instanceof MemberReferenceExpression) {
      const lhsExpression = lValue.lhs;
      const lhsLValue = lhsExpression as unknown as ILValue;
      this.checkExpression(lValue.lhs);
      if (lValue.lhs.forceType() instanceof StructType) {
        this.checkLValue(lhsLValue);
      }
      const lhsType = lhsExpression.forceType();
      const memberType = lhsType.typeOfMember(lValue.memberToken.content);
      if (memberType === undefined) {
        this.errors.push(new TypeHasNoMemberCalledError(lValue.memberToken.range, lhsType.toString(), lValue.memberToken.content));
      } else {
        lValue.rhsType = memberType;
      }
    }
  }
  private checkExpression(expression: Expression, target?: ITypeCheckingType | undefined) {
    if (expression instanceof PlaceholderExpression) {
      return;
    }
    if (expression instanceof BinaryOperatorExpression) {
      const lhs = expression.lhs;
      const rhs = expression.rhs;
      this.checkExpression(lhs);
      const lhsType = lhs.forceType();
      const operator = expression.operator;
      const str = operator.content;
      const operatorType = lhsType.typeOfOperator(str);
      if (operatorType === undefined) {
        this.errors.push(new OperatorNotDefinedForTypeError(operator.range, lhsType.name, str));
        this.checkExpression(rhs, undefined);
        return;
      }
      if (!(operatorType instanceof TypeCheckingFunctionType)) {
        throw new Error();
      }
      const [operandType] = operatorType.args;
      this.checkExpression(rhs, operandType);
      expression.setType(operatorType.result);
    } else if (expression instanceof FloatingPointLiteralExpression) {
      throw new Error();
    } else if (expression instanceof IdentifierCallExpression) {
      const entry = expression.lhs.entry;
      const argExpressions = expression.args;
      if (entry === undefined) {
        throw new Error();
      }
      const functionType = entry.type;
      if (!(functionType instanceof TypeCheckingFunctionType)) {
        throw new Error();
      }
      const argTypes = functionType.args;
      const resultType = functionType.result;
      let i = 0;
      while (i < argTypes.length) {
        this.checkExpression(argExpressions[i], argTypes[i]);
        i++;
      }
      expression.setType(resultType);
    } else if (expression instanceof IntegerLiteralExpression) {
      if (target === undefined) {
        expression.setType(this.integer);
      } else {
        if (this.u8.equals(target)) {
          expression.setType(target);
        } else if (this.u16.equals(target)) {
          expression.setType(target);
        } else if (this.u32.equals(target)) {
          expression.setType(target);
        } else if (this.u64.equals(target)) {
          expression.setType(target);
        } else if (this.i8.equals(target)) {
          expression.setType(target);
        } else if (this.i16.equals(target)) {
          expression.setType(target);
        } else if (this.i32.equals(target)) {
          expression.setType(target);
        } else if (this.i64.equals(target)) {
          expression.setType(target);
        } else {
          expression.setType(this.integer);
        }
      }
    } else if (expression instanceof PostfixUnaryOperatorExpression) {
      const operand = expression.operand;
      this.checkExpression(operand);
      const operandType = operand.forceType();
      const operator = expression.operator;
      const str = operator.content;
      const operatorType = operandType.typeOfOperator(str);
      if (operatorType === undefined) {
        throw new Error();
      }
      if (!(operatorType instanceof TypeCheckingFunctionType)) {
        throw new Error();
      }
      expression.setType(operatorType.result);
    } else if (expression instanceof PrefixUnaryOperatorExpression) {
      const operand = expression.operand;
      this.checkExpression(operand);
      const operandType = operand.forceType();
      const operator = expression.operator;
      const str = operator.content;
      const operatorType = operandType.typeOfOperator(str);
      if (operatorType === undefined) {
        throw new Error();
      }
      if (!(operatorType instanceof TypeCheckingFunctionType)) {
        throw new Error();
      }
      expression.setType(operatorType.result);
    } else if (expression instanceof StringLiteralExpression) {
      expression.setType(this.string);
    } else if (expression instanceof VariableReferenceExpression) {
      const entry = expression.entry;
      if (entry === undefined) {
        return;
      }
      const type = entry.type;
      if (type === undefined) {
        return;
      }
      expression.type = type;
    } else if (expression instanceof ConstructorCallExpression) {
      const constructedType = expression.constructedType;
      const argExpressions = expression.args;
      const functionType: TypeCheckingFunctionType | undefined = constructedType.typeOfConstructor();
      if (!(functionType instanceof TypeCheckingFunctionType)) {
        return;
        throw new Error();
      }
      const argTypes = functionType.args;
      const resultType = functionType.result;
      let i = 0;
      while (i < argTypes.length) {
        this.checkExpression(argExpressions[i], argTypes[i]);
        i++;
      }
      expression.setType(resultType);
    } else if (expression instanceof MemberReferenceExpression) {
      this.checkExpression(expression.lhs, undefined);
      const lhsType = expression.lhs.forceType();
      const memberType = lhsType.typeOfMember(expression.memberToken.content);
      if (memberType === undefined) {
        this.errors.push(new TypeHasNoMemberCalledError(expression.memberToken.range, lhsType.toString(), expression.memberToken.content));
        expression.setType(new TypeCheckingVoidType(this.rootTypeTreeNode));
      } else {
        expression.setType(memberType);
      }
    } else if (expression instanceof MemberCallExpression) {
      this.checkExpression(expression.lhs, undefined);
      const lhsType = expression.lhs.forceType();
      const memberType = lhsType.typeOfMember(expression.memberToken.content);
      if (memberType === undefined) {
        this.errors.push(new TypeHasNoMemberCalledError(expression.memberToken.range, lhsType.toString(), expression.memberToken.content));
        expression.setType(new TypeCheckingVoidType(this.rootTypeTreeNode));
      } else {
        if (!(memberType instanceof TypeCheckingFunctionType)) {
          this.errors.push(new MemberIsNotCallableError(expression.memberToken.range, expression.memberToken.content, memberType.toString()));
          expression.setType(new TypeCheckingVoidType(this.rootTypeTreeNode));
        } else {
          let index = 0;
          for (const arg of expression.args) {
            const expectedType = memberType.args[index];
            this.checkExpression(arg, expectedType);
            index++;
          }
          expression.setType(memberType.result);
        }
      }
    }
    if (target !== undefined) {
      const type = expression.type;
      if (type === undefined) {
        throw new Error();
      }
      if (!type.equals(target)) {
        expression.implictConversionTargetType = target;
      }
    }
  }
}
