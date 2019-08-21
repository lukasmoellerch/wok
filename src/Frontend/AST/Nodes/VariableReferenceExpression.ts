import { Token } from "../../Lexer/Token";
import { ILValue } from "../AST";
import { Expression } from "./Expression";

export class VariableReferenceExpression extends Expression implements ILValue {
  public lvalue: void = undefined;
  public variableToken: Token;
  constructor(variableToken: Token) {
    super();
    this.variableToken = variableToken;
    this.children = [variableToken];
  }
}
