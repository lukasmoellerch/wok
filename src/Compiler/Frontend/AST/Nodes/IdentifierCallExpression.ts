import { Expression } from "./Expression";
import { VariableReferenceExpression } from "./VariableReferenceExpression";

export class IdentifierCallExpression extends Expression {
  public name = "IdentifierCallExpression";
  public lhs: VariableReferenceExpression;
  public args: Expression[];
  constructor(lhs: VariableReferenceExpression, args: Expression[]) {
    super();
    this.lhs = lhs;
    this.args = args;
    this.children = [lhs, ...args];
  }
  public addImplictConversionsToChildren() {
    this.args = this.args.map((a) => a.addImplictConversionIfNeeded());
    this.children = [this.lhs, ...this.args];
  }
}
