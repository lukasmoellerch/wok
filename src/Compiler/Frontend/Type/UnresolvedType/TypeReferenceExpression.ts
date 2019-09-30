import { Token } from "../../Lexer/Token";
import { TypeExpression } from "./TypeExpression";
export class TypeReferenceExpression extends TypeExpression {
  public name: Token;
  public parameters: TypeExpression[];
  constructor(name: Token, parameters: TypeExpression[]) {
    super();
    this.name = name;
    this.parameters = parameters;
  }
  public stringifyType(): string {
    return `${this.name.content}<${this.parameters.map((a) => a.stringifyType()).join(", ")}>`;
  }
}
