import { Token } from "../../Lexer/Token";
import { AssignmentStatement } from "./AssignmentStatement";
import { ExpressionWrapper } from "./ExpressionWrapper";
import { ImplictConversionExpression } from "./ImplictConversionExpression";
import { Statement } from "./Statement";
export class ReturnStatement extends Statement {
  public name = "ReturnStatement";
  public returnToken: Token;
  public value: ExpressionWrapper | undefined;
  constructor(returnToken: Token, value: ExpressionWrapper | undefined) {
    super();
    this.returnToken = returnToken;
    this.value = value;
    if (value !== undefined) {
      this.children = [returnToken, value];
    } else {
      this.children = [returnToken];
    }
  }
  public addImplictConversionsToChildren() {
    const value = this.value;
    if (value === undefined) {
      return;
    }
    const expression = value.expression;
    if (expression instanceof AssignmentStatement) {
      throw new Error();
    }
    if (expression === undefined) {
      return;
    }
    const implictConversionTargetType = expression.implictConversionTargetType;
    if (implictConversionTargetType !== undefined) {
      value.expression = new ImplictConversionExpression(expression.forceType(), implictConversionTargetType, expression);
    }
  }
}
