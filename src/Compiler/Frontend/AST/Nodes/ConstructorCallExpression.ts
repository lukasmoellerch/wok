import { ITypeCheckingType } from "../ExpressionType";
import { Expression } from "./Expression";

export class ConstructorCallExpression extends Expression {
  public constructedType: ITypeCheckingType;
  public args: Expression[];
  constructor(constructedType: ITypeCheckingType, args: Expression[]) {
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
