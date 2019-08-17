import { TypeExpression } from "./TypeExpression";
import { TypeReferenceExpression } from "./TypeReferenceExpression";
export class TypeMemberExpression extends TypeExpression {
  public lhs: TypeReferenceExpression;
  public parameters: TypeExpression[];
  constructor(lhs: TypeReferenceExpression, parameters: TypeExpression[]) {
    super();
    this.lhs = lhs;
    this.parameters = parameters;
  }
  public stringifyType(): string {
    return `${this.lhs.stringifyType()}<${this.parameters.map((a) => a.stringifyType()).join(", ")}>`;
  }
}
