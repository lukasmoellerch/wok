import { ASTNode } from "../../AST/ASTNode";
import { TypeAttribute } from "../../AST/Attributes/TypeAttribute";
export class TypeExpression extends ASTNode {
  constructor() {
    super();
    this.setAttribute(new TypeAttribute(this));
  }
  public stringifyType(): string {
    return "<type expression>";
  }
}
