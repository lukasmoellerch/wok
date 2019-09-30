import { ASTNode } from "../../AST/ASTNode";
export class TypeExpression extends ASTNode {
  constructor() {
    super();
  }
  public stringifyType(): string {
    return "<type expression>";
  }
}
