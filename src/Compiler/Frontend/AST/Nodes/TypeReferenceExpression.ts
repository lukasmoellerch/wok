import { TypeTreeNode } from "../../Type Scope/TypeScope";
import { IType } from "../../Type/Type";
import { Expression } from "./Expression";

export class TypeReferenceExpression extends Expression {
  public type: IType | undefined;
  public node: TypeTreeNode;
  constructor(node: TypeTreeNode) {
    super();
    this.node = node;
    this.type = node.type;
    this.children = [];
  }

}
