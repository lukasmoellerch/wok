import { Token } from "../../Lexer/Token";
import { IType } from "../../Type/Type";
import { ILValue } from "../AST";
import { Expression } from "./Expression";

export class PlaceholderExpression extends Expression implements ILValue {
  public rhsType: IType | undefined;
  public lvalue: undefined = undefined;
  public token: Token;
  constructor(token: Token) {
    super();
    this.token = token;
    this.children = [token];
  }
}
