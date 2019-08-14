import { Token } from "../../Lexer/Token";
import { Expression } from "./Expression";
export class PostfixUnaryOperatorExpression extends Expression {
  public operand: Expression;
  public operator: Token;
  constructor(operand: Expression, operator: Token) {
    super();
    this.operand = operand;
    this.operator = operator;
  }
}
