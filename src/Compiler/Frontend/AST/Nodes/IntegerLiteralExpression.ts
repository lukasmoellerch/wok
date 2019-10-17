import { Token } from "../../Lexer/Token";
import { Expression } from "./Expression";

export class IntegerLiteralExpression extends Expression {
  public name = "IntegerLiteralExpression";
  public integerLiteralToken: Token;
  constructor(integerLiteralToken: Token) {
    super();
    this.integerLiteralToken = integerLiteralToken;
    this.children = [integerLiteralToken];
  }
}
