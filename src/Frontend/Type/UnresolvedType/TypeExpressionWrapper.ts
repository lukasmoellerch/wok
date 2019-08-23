import { ASTNode } from "../../AST/ASTNode";
import { TypeScope } from "../../Type Scope/TypeScopeBuilder";
import { IType } from "../Type";
import { VoidType } from "../VoidType";
import { TypeExpression } from "./TypeExpression";

export class TypeExpressionWrapper extends ASTNode {
  public expression: TypeExpression;
  public typeScope: TypeScope = new TypeScope();
  public type: IType;
  constructor(expression: TypeExpression) {
    super();
    this.expression = expression;
    this.children = [expression];
    this.type = new VoidType();
  }
}
