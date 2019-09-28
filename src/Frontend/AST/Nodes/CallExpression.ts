import { Expression } from "./Expression";

export class CallExpression extends Expression {
  public lhs: Expression;
  public args: Expression[];
  constructor(lhs: Expression, args: Expression[]) {
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
