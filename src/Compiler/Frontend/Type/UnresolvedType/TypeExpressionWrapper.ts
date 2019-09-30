import { ASTNode } from "../../AST/ASTNode";
import { TypeTreeNode } from "../../Type Scope/TypeScope";
import { IType } from "../Type";
import { TypeExpression } from "./TypeExpression";

export class TypeExpressionWrapper extends ASTNode {
  public expression: TypeExpression;
  public wrappingTypeTreeNode: TypeTreeNode | undefined;
  public type: IType | undefined;
  constructor(expression: TypeExpression) {
    super();
    this.expression = expression;
    this.children = [expression];
  }
}
