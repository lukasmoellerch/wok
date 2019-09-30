import { Token } from "../../Lexer/Token";
import { Expression } from "./Expression";
export class BinaryOperatorExpression extends Expression {
  public lhs: Expression;
  public rhs: Expression;
  public operator: Token;
  constructor(lhs: Expression, rhs: Expression, operator: Token) {
    super();
    this.lhs = lhs;
    this.rhs = rhs;
    this.operator = operator;
    this.children = [lhs, operator, rhs];
  }
  public addImplictConversionsToChildren() {
    this.lhs = this.lhs.addImplictConversionIfNeeded();
    this.rhs = this.rhs.addImplictConversionIfNeeded();
    this.children = [this.lhs, this.operator, this.rhs];
  }
}
