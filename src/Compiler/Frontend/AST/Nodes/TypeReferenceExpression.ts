import { TypeTreeNode } from "../../Type Scope/TypeScope";
import { ITypeCheckingType } from "../ExpressionType";
import { Expression } from "./Expression";

export class TypeReferenceExpression extends Expression {
  public type: ITypeCheckingType | undefined;
  public node: TypeTreeNode;
  constructor(node: TypeTreeNode) {
    super();
    this.node = node;
    this.type = node.typeCheckingType;
    if (this.type === undefined) {
      debugger;
    }
    this.children = [];
  }
}
