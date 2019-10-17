import { Token } from "../../Lexer/Token";
import { Expression } from "./Expression";

export class StringLiteralExpression extends Expression {
  public name = "StringLiteralExpression";
  public stringLiteralToken: Token;
  constructor(stringLiteralToken: Token) {
    super();
    this.stringLiteralToken = stringLiteralToken;
    this.children = [stringLiteralToken];
  }
}
