import { TypeTreeNode } from "../../Type Scope/TypeScope";
import { ITypeCheckingType } from "../ExpressionType";
import { Expression } from "./Expression";

export class TypeReferenceExpression extends Expression {
  public name = "TypeReferenceExpression";
  public type: ITypeCheckingType | undefined;
  public node: TypeTreeNode;
  constructor(node: TypeTreeNode) {
    super();
    this.node = node;
    this.type = node.typeCheckingType;
    this.children = [];
  }
}
