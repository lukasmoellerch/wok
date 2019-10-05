import { ITypeCheckingType } from "../ExpressionType";
import { Expression } from "./Expression";

export class ImplictConversionExpression extends Expression {
  public from: ITypeCheckingType;
  public to: ITypeCheckingType;
  public value: Expression;
  constructor(from: ITypeCheckingType, to: ITypeCheckingType, value: Expression) {
    super();
    this.from = from;
    this.to = to;
    this.value = value;
    this.children = [value];
    this.setType(to);
  }
}
