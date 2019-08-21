import { Token } from "../../Lexer/Token";
import { ILValue } from "../AST";
import { Expression } from "./Expression";

export class PlaceholderExpression extends Expression implements ILValue {
  public lvalue: void;
  public token: Token;
  constructor(token: Token) {
    super();
    this.token = token;
    this.children = [token];
  }
}
