import { Token } from "../../Lexer/Token";
import { TypeExpression } from "./TypeExpression";
export class TypeReferenceExpression extends TypeExpression {
  public nameToken: Token;
  public parameters: TypeExpression[];
  constructor(name: Token, parameters: TypeExpression[]) {
    super();
    this.nameToken = name;
    this.parameters = parameters;
  }
  public stringifyType(): string {
    return `${this.nameToken.content}<${this.parameters.map((a) => a.stringifyType()).join(", ")}>`;
  }
}
