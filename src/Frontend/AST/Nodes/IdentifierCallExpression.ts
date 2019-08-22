import { Expression } from "./Expression";
import { VariableReferenceExpression } from "./VariableReferenceExpression";

export class IdentifierCallExpression extends Expression {
  public lhs: VariableReferenceExpression;
  public args: Expression[];
  constructor(lhs: VariableReferenceExpression, args: Expression[]) {
    super();
    this.lhs = lhs;
    this.args = args;
  }
}
