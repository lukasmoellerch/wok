import { Token } from "../../Lexer/Token";
import { TypeTreeNode } from "../../Type Scope/TypeScope";
import { Expression } from "./Expression";

export class TypeReferenceExpression extends Expression {
  public nameToken: Token;
  public node: TypeTreeNode | undefined;
  constructor(nameToken: Token) {
    super();
    this.nameToken = nameToken;
    this.children = [nameToken];
  }

}
