
import { ASTWalker } from "../AST/ASTWalker";
import { AssignmentStatement } from "../AST/Nodes/AssignmentStatement";
import { Expression } from "../AST/Nodes/Expression";
import { ExpressionWrapper } from "../AST/Nodes/ExpressionWrapper";
import { ReturnStatement } from "../AST/Nodes/ReturnStatement";

export class ImplictConversionWrapper extends ASTWalker {
  protected walkExpression(expression: Expression) {
    super.walkExpression(expression);
    expression.addImplictConversionsToChildren();
  }
  protected walkExpressionWrapper(expressionWrapper: ExpressionWrapper) {
    super.walkExpressionWrapper(expressionWrapper);
    expressionWrapper.addImplictConversionsToChildren();
  }
  protected walkAssignmentStatement(assignmentStatement: AssignmentStatement) {
    super.walkAssignmentStatement(assignmentStatement);
    assignmentStatement.addImplictConversionsToChildren();
  }
  protected walkReturnStatement(returnStatement: ReturnStatement) {
    super.walkReturnStatement(returnStatement);
    returnStatement.addImplictConversionsToChildren();
  }
}
