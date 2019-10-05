import { ASTNode } from "../../AST/ASTNode";
import { ITypeCheckingType } from "../../AST/ExpressionType";
import { TypeTreeNode } from "../../Type Scope/TypeScope";
import { TypeExpression } from "./TypeExpression";

export class TypeExpressionWrapper extends ASTNode {
  public expression: TypeExpression;
  public wrappingTypeTreeNode: TypeTreeNode | undefined;
  public type: ITypeCheckingType | undefined;
  constructor(expression: TypeExpression) {
    super();
    this.expression = expression;
    this.children = [expression];
  }
}
