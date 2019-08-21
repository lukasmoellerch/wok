import { Token } from "../../Lexer/Token";
import { Expression } from "./Expression";

export class VariableReferenceExpression extends Expression {
  public variableToken: Token;
  constructor(variableToken: Token) {
    super();
    this.variableToken = variableToken;
    this.children = [variableToken];
  }
}
