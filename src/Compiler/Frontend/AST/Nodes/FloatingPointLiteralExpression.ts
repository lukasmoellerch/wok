import { Token } from "../../Lexer/Token";
import { Expression } from "./Expression";

export class FloatingPointLiteralExpression extends Expression {
  public floatingPointLiteralToken: Token;
  constructor(floatingPointLiteralToken: Token) {
    super();
    this.floatingPointLiteralToken = floatingPointLiteralToken;
    this.children = [floatingPointLiteralToken];
  }
}
