import { IType } from "../../Type/Type";
import { Expression } from "./Expression";

export class ConstructorCallExpression extends Expression {
  public type: IType;
  public args: Expression[];
  constructor(type: IType, args: Expression[]) {
    super();
    this.type = type;
    this.args = args;
    this.children = [...args];
  }
  public addImplictConversionsToChildren() {
    this.args = this.args.map((a) => a.addImplictConversionIfNeeded());
    this.children = [...this.args];
  }
}
