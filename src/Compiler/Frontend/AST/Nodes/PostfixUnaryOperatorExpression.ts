import { Token } from "../../Lexer/Token";
import { Expression } from "./Expression";
export class PostfixUnaryOperatorExpression extends Expression {
  public name = "PostfixUnaryOperatorExpression";
  public operand: Expression;
  public operator: Token;
  constructor(operand: Expression, operator: Token) {
    super();
    this.operand = operand;
    this.operator = operator;
    this.children = [operand, operator];
  }
  public addImplictConversionsToChildren() {
    this.operand = this.operand.addImplictConversionIfNeeded();
    this.children = [this.operand, this.operator];
  }
}
