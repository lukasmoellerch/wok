import { IType } from "../../Type/Type";
import { Expression } from "./Expression";

export class ImplictConversionExpression extends Expression {
  public from: IType;
  public to: IType;
  public value: Expression;
  constructor(from: IType, to: IType, value: Expression) {
    super();
    this.from = from;
    this.to = to;
    this.value = value;
    this.children = [value];
    this.setType(to);
  }
}
