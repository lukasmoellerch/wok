import { IType } from "../../Type/Type";
import { Expression } from "./Expression";

export class ConstructorCallExpression extends Expression {
  public constructedType: IType;
  public args: Expression[];
  constructor(constructedType: IType, args: Expression[]) {
    super();
    this.constructedType = constructedType;
    if (constructedType.toString() === "void") {
      throw new Error();
    }
    this.args = args;
    this.children = [...args];
  }
  public addImplictConversionsToChildren() {
    this.args = this.args.map((a) => a.addImplictConversionIfNeeded());
    this.children = [...this.args];
  }
}
