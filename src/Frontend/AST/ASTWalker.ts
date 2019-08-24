import { TypeExpressionWrapper } from "../Type/UnresolvedType/TypeExpressionWrapper";
import { ILValue, ITopLevelDeclaration } from "./AST";
import { AssignmentStatement } from "./Nodes/AssignmentStatement";
import { BinaryOperatorExpression } from "./Nodes/BinaryOperatorExpression";
import { Block } from "./Nodes/Block";
import { ConstantDeclaration } from "./Nodes/ConstantDeclaration";
import { Expression } from "./Nodes/Expression";
import { ExpressionWrapper } from "./Nodes/ExpressionWrapper";
import { FloatingPointLiteralExpression } from "./Nodes/FloatingPointLiteralExpression";
import { FunctionArgumentDeclaration } from "./Nodes/FunctionArgumentDeclaration";
import { IdentifierCallExpression } from "./Nodes/IdentifierCallExpression";
import { IfStatement } from "./Nodes/IfStatement";
import { InfixOperatorDeclaration } from "./Nodes/InfixOperatorDeclaration";
import { IntegerLiteralExpression } from "./Nodes/IntegerLiteralExpression";
import { PlaceholderExpression } from "./Nodes/PlaceholderExpression";
import { PostfixOperatorDeclaration } from "./Nodes/PostfixOperatorDeclaration";
import { PostfixUnaryOperatorExpression } from "./Nodes/PostfixUnaryOperatorExpression";
import { PrefixOperatorDeclaration } from "./Nodes/PrefixOperatorDeclaration";
import { PrefixUnaryOperatorExpression } from "./Nodes/PrefixUnaryOperatorExpression";
import { SourceFile } from "./Nodes/SourceFile";
import { Statement } from "./Nodes/Statement";
import { UnboundFunctionDeclaration } from "./Nodes/UnboundFunctionDeclaration";
import { VariableDeclaration } from "./Nodes/VariableDeclaration";
import { VariableReferenceExpression } from "./Nodes/VariableReferenceExpression";
import { WhileStatement } from "./Nodes/WhileStatement";

export class ASTWalker {
  public walkSourceFile(sourceFile: SourceFile) {
    for (const delcaration of sourceFile.topLevelDeclarations) {
      this.walkTopLevelDeclaration(delcaration);
    }
  }
  protected walkTopLevelDeclaration(topLevelDeclaration: ITopLevelDeclaration) {
    if (topLevelDeclaration instanceof PrefixOperatorDeclaration) {
      this.walkPrefixOperatorDeclaration(topLevelDeclaration);
    }
    if (topLevelDeclaration instanceof InfixOperatorDeclaration) {
      this.walkInfixOperatorDeclaration(topLevelDeclaration);
    }
    if (topLevelDeclaration instanceof PostfixOperatorDeclaration) {
      this.walkPostfixOperatorDeclaration(topLevelDeclaration);
    }
    if (topLevelDeclaration instanceof UnboundFunctionDeclaration) {
      this.walkUnboundFunctionDeclaration(topLevelDeclaration);
    }
  }
  protected walkPrefixOperatorDeclaration(prefixOperatorDeclaration: PrefixOperatorDeclaration) {
    return prefixOperatorDeclaration;
  }
  protected walkInfixOperatorDeclaration(infixOperatorDeclaration: InfixOperatorDeclaration) {
    return infixOperatorDeclaration;
  }
  protected walkPostfixOperatorDeclaration(postfixOperatorDeclaration: PostfixOperatorDeclaration) {
    return postfixOperatorDeclaration;
  }
  protected walkUnboundFunctionDeclaration(unboundFunctionDeclaration: UnboundFunctionDeclaration) {
    for (const argumentDeclaration of unboundFunctionDeclaration.argumentDeclarations) {
      this.walkArgumentDeclaration(argumentDeclaration);
    }
    this.walkBlock(unboundFunctionDeclaration.block);
  }
  protected walkArgumentDeclaration(argumentDeclaration: FunctionArgumentDeclaration) {
    this.walkTypeExpressionWrapper(argumentDeclaration.type);
  }
  protected walkBlock(block: Block) {
    for (const statement of block.statements) {
      this.walkStatement(statement);
    }
  }
  protected walkStatement(statement: Statement) {
    if (statement instanceof ExpressionWrapper) {
      this.walkExpressionWrapper(statement);
    }
    if (statement instanceof IfStatement) {
      this.walkIfStatement(statement);
    }
    if (statement instanceof WhileStatement) {
      this.walkWhileStatement(statement);
    }
    if (statement instanceof VariableDeclaration) {
      this.walkVariableDeclaration(statement);
    }
    if (statement instanceof ConstantDeclaration) {
      this.walkConstantDeclaration(statement);
    }
    if (statement instanceof AssignmentStatement) {
      this.walkAssignmentStatement(statement);
    }
  }
  protected walkExpressionWrapper(expressionWrapper: ExpressionWrapper) {
    if (expressionWrapper.expression instanceof Expression) {
      this.walkExpression(expressionWrapper.expression);
    }
    if (expressionWrapper.expression instanceof AssignmentStatement) {
      this.walkAssignmentStatement(expressionWrapper.expression);
    }
  }
  protected walkExpression(expression: Expression) {
    if (expression instanceof BinaryOperatorExpression) {
      this.walkBinaryOperatorExpression(expression);
    }
    if (expression instanceof FloatingPointLiteralExpression) {
      this.walkFloatingPointLiteralExpression(expression);
    }
    if (expression instanceof IntegerLiteralExpression) {
      this.walkIntegerLiteralExpression(expression);
    }
    if (expression instanceof PlaceholderExpression) {
      this.walkPlaceholderExpression(expression);
    }
    if (expression instanceof PostfixUnaryOperatorExpression) {
      this.walkPostfixUnaryOperatorExpression(expression);
    }
    if (expression instanceof PrefixUnaryOperatorExpression) {
      this.walkPrefixUnaryOperatorExpression(expression);
    }
    if (expression instanceof VariableReferenceExpression) {
      this.walkVariableReferenceExpression(expression);
    }
    if (expression instanceof IdentifierCallExpression) {
      this.walkIdentifierCallExpression(expression);
    }
  }
  protected walkIdentifierCallExpression(identifierCallExpression: IdentifierCallExpression) {
    this.walkVariableReferenceExpression(identifierCallExpression.lhs);
    for (const arg of identifierCallExpression.args) {
      this.walkExpression(arg);
    }
  }
  protected walkIfStatement(ifStatement: IfStatement) {
    this.walkExpressionWrapper(ifStatement.condition);
    this.walkBlock(ifStatement.block);
  }
  protected walkWhileStatement(whileStatement: WhileStatement) {
    this.walkExpressionWrapper(whileStatement.condition);
    this.walkBlock(whileStatement.block);
  }
  protected walkVariableDeclaration(variableDeclaration: VariableDeclaration) {
    if (variableDeclaration.typeHint !== undefined) {
      this.walkTypeExpressionWrapper(variableDeclaration.typeHint);
    }
    this.walkExpressionWrapper(variableDeclaration.value);
  }
  protected walkConstantDeclaration(constantDeclaration: ConstantDeclaration) {
    if (constantDeclaration.typeHint !== undefined) {
      this.walkTypeExpressionWrapper(constantDeclaration.typeHint);
    }
    this.walkExpressionWrapper(constantDeclaration.value);
  }
  protected walkAssignmentStatement(assignmentStatement: AssignmentStatement) {
    this.walkLValue(assignmentStatement.target);
    this.walkExpression(assignmentStatement.value);
  }
  protected walkLValue(lvalue: ILValue) {
    if (lvalue instanceof VariableReferenceExpression) {
      this.walkVariableReferenceExpression(lvalue);
    }
  }
  protected walkBinaryOperatorExpression(binaryOperatorExpression: BinaryOperatorExpression) {
    this.walkExpression(binaryOperatorExpression.lhs);
    this.walkExpression(binaryOperatorExpression.rhs);
  }
  protected walkFloatingPointLiteralExpression(floatingPointLiteralExpression: FloatingPointLiteralExpression) {
    return floatingPointLiteralExpression;
  }
  protected walkIntegerLiteralExpression(integerLiteralExpression: IntegerLiteralExpression) {
    return integerLiteralExpression;
  }
  protected walkPlaceholderExpression(placeholderExpression: PlaceholderExpression) {
    return placeholderExpression;
  }
  protected walkPostfixUnaryOperatorExpression(postfixUnaryOperatorExpression: PostfixUnaryOperatorExpression) {
    return postfixUnaryOperatorExpression;
  }
  protected walkPrefixUnaryOperatorExpression(prefixUnaryOperatorExpression: PrefixUnaryOperatorExpression) {
    return prefixUnaryOperatorExpression;
  }
  protected walkVariableReferenceExpression(variableReferenceExpression: VariableReferenceExpression) {
    return variableReferenceExpression;
  }
  protected walkTypeExpressionWrapper(typeExpressionWrapper: TypeExpressionWrapper) {
    return typeExpressionWrapper;
  }
}
