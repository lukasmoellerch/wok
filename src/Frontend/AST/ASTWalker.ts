import { ILValue, ITopLevelDeclaration } from "./AST";
import { AssignmentStatement } from "./Nodes/AssignmentStatement";
import { BinaryOperatorExpression } from "./Nodes/BinaryOperatorExpression";
import { Block } from "./Nodes/Block";
import { ConstantDeclaration } from "./Nodes/ConstantDeclaration";
import { Expression } from "./Nodes/Expression";
import { FloatingPointLiteralExpression } from "./Nodes/FloatingPointLiteralExpression";
import { FunctionArgumentDeclaration } from "./Nodes/FunctionArgumentDeclaration";
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
    return argumentDeclaration;
  }
  protected walkBlock(block: Block) {
    for (const statement of block.statements) {
      this.walkStatement(statement);
    }
  }
  protected walkStatement(statement: Statement) {
    if (statement instanceof Expression) {
      this.walkExpression(statement);
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
  }
  protected walkIfStatement(ifStatement: IfStatement) {
    this.walkExpression(ifStatement.condition);
    this.walkBlock(ifStatement.block);
  }
  protected walkWhileStatement(whileStatement: WhileStatement) {
    this.walkExpression(whileStatement.condition);
    this.walkBlock(whileStatement.block);
  }
  protected walkVariableDeclaration(variableDeclaration: VariableDeclaration) {
    return variableDeclaration;
  }
  protected walkConstantDeclaration(constantDeclaration: ConstantDeclaration) {
    return constantDeclaration;
  }
  protected walkAssignmentStatement(assignmentStatement: AssignmentStatement) {
    this.walkLValue(assignmentStatement.target);
    this.walkExpression(assignmentStatement.value);
  }
  protected walkLValue(lvalue: ILValue) {
    return lvalue;
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

}
