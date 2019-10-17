import { Token } from "../../Lexer/Token";
import { ILValue } from "../AST";
import { ITypeCheckingType } from "../ExpressionType";
import { Expression } from "./Expression";

export class PlaceholderExpression extends Expression implements ILValue {
  public name = "PlaceholderExpression";
  public rhsType: ITypeCheckingType | undefined;
  public lvalue: undefined = undefined;
  public token: Token;
  constructor(token: Token) {
    super();
    this.token = token;
    this.children = [token];
  }
}
