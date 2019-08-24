import { ILValue } from "../AST/AST";
import { ASTWalker } from "../AST/ASTWalker";
import { TypeAttribute } from "../AST/Attributes/TypeAttribute";
import { AssignmentStatement } from "../AST/Nodes/AssignmentStatement";
import { BinaryOperatorExpression } from "../AST/Nodes/BinaryOperatorExpression";
import { ConstantDeclaration } from "../AST/Nodes/ConstantDeclaration";
import { Expression } from "../AST/Nodes/Expression";
import { FloatingPointLiteralExpression } from "../AST/Nodes/FloatingPointLiteralExpression";
import { FunctionArgumentDeclaration } from "../AST/Nodes/FunctionArgumentDeclaration";
import { IdentifierCallExpression } from "../AST/Nodes/IdentifierCallExpression";
import { IfStatement } from "../AST/Nodes/IfStatement";
import { IntegerLiteralExpression } from "../AST/Nodes/IntegerLiteralExpression";
import { PostfixUnaryOperatorExpression } from "../AST/Nodes/PostfixUnaryOperatorExpression";
import { PrefixUnaryOperatorExpression } from "../AST/Nodes/PrefixUnaryOperatorExpression";
import { StringLiteralExpression } from "../AST/Nodes/StringLiteralExpression";
import { VariableDeclaration } from "../AST/Nodes/VariableDeclaration";
import { VariableReferenceExpression } from "../AST/Nodes/VariableReferenceExpression";
import { WhileStatement } from "../AST/Nodes/WhileStatement";
import { CompilerError, WritingToConstantError } from "../Parser/ParserError";
import { FunctionType } from "../Type/FunctionType";
import { NativeIntegerType } from "../Type/NativeType";
import { IType } from "../Type/Type";
import { VariableScopeEntryType } from "../VariableScope/VariableScope";

export class TypeChecker extends ASTWalker {
  public errors: CompilerError[];
  public u8 = new NativeIntegerType(false, 1);
  public u16 = new NativeIntegerType(false, 2);
  public u32 = new NativeIntegerType(false, 4);
  public u64 = new NativeIntegerType(false, 8);
  public i8 = new NativeIntegerType(true, 1);
  public i16 = new NativeIntegerType(true, 2);
  public i32 = new NativeIntegerType(true, 4);
  public i64 = new NativeIntegerType(true, 8);
  public bool = this.u8;
  public integer = this.i32;
  public unsignedInteger = this.u32;
  constructor(errors: CompilerError[]) {
    super();
    this.errors = errors;
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
        variableDeclaration.setAttribute(new TypeAttribute(expression.type));
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
        console.log("set entry.type to of", entry.str, "to", expression.type.name);
        constantDeclaration.setAttribute(new TypeAttribute(expression.type));
      }
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
    }
  }
  private checkExpression(expression: Expression, target?: IType | undefined) {
    if (expression instanceof BinaryOperatorExpression) {
      const lhs = expression.lhs;
      const rhs = expression.rhs;
      this.checkExpression(lhs);
      const lhsType = lhs.type;
      const operator = expression.operator;
      const str = operator.content;
      const operatorType = lhsType.typeOfOperator(str, 1);
      if (operatorType === undefined) {
        throw new Error();
      }
      if (!(operatorType instanceof FunctionType)) {
        throw new Error();
      }
      const [operandType] = operatorType.args;
      this.checkExpression(rhs, operandType);
      expression.setType(operatorType.result);
    } else if (expression instanceof FloatingPointLiteralExpression) {
      throw new Error();
    } else if (expression instanceof IdentifierCallExpression) {
      throw new Error();
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
      const operandType = operand.type;
      const operator = expression.operator;
      const str = operator.content;
      const operatorType = operandType.typeOfOperator(str, 0);
      if (operatorType === undefined) {
        throw new Error();
      }
      if (!(operatorType instanceof FunctionType)) {
        throw new Error();
      }
      expression.setType(operatorType.result);
    } else if (expression instanceof PrefixUnaryOperatorExpression) {
      const operand = expression.operand;
      this.checkExpression(operand);
      const operandType = operand.type;
      const operator = expression.operator;
      const str = operator.content;
      const operatorType = operandType.typeOfOperator(str, 0);
      if (operatorType === undefined) {
        throw new Error();
      }
      if (!(operatorType instanceof FunctionType)) {
        throw new Error();
      }
      expression.setType(operatorType.result);
    } else if (expression instanceof StringLiteralExpression) {
      throw new Error();
    } else if (expression instanceof VariableReferenceExpression) {
      const entry = expression.entry;
      if (entry === undefined) {
        throw new Error();
      }
      const type = entry.type;
      if (type === undefined) {
        throw new Error();
      }
      expression.type = type;
    }
    if (target !== undefined) {
      const type = expression.type;
      if (!type.equals(target)) {
        expression.implictConversionTargetType = target;
      }
    }
  }
}
