import { Token } from "../../Lexer/Token";
import { Expression } from "./Expression";
export class PrefixUnaryOperatorExpression extends Expression {
  public operand: Expression;
  public operator: Token;
  constructor(operand: Expression, operator: Token) {
    super();
    this.operand = operand;
    this.operator = operator;
    this.children = [operator, operand];
  }
  public addImplictConversionsToChildren() {
    this.operand = this.operand.addImplictConversionIfNeeded();
    this.children = [this.operator, this.operand];
  }
}
