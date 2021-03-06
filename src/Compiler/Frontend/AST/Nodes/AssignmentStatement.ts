import { Token } from "../../Lexer/Token";
import { ILValue } from "../AST";
import { Expression } from "./Expression";
import { ImplictConversionExpression } from "./ImplictConversionExpression";
import { Statement } from "./Statement";

export class AssignmentStatement extends Statement {
  public name = "AssignmentStatement";
  public target: ILValue;
  public assignmentOperator: Token;
  public value: Expression;
  constructor(target: ILValue, assignmentOperator: Token, value: Expression) {
    super();
    this.target = target;
    this.assignmentOperator = assignmentOperator;
    this.value = value;
    this.children = [target, assignmentOperator, value];
  }
  public addImplictConversionsToChildren() {
    const expression = this.value;
    const implictConversionTargetType = expression.implictConversionTargetType;
    if (implictConversionTargetType !== undefined) {
      this.value = new ImplictConversionExpression(expression.forceType(), implictConversionTargetType, expression);
    }
  }
}
