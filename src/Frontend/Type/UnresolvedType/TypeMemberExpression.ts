import { Token } from "../../Lexer/Token";
import { TypeExpression } from "./TypeExpression";
import { TypeReferenceExpression } from "./TypeReferenceExpression";
export class TypeMemberExpression extends TypeExpression {
  public lhs: TypeReferenceExpression;
  public member: Token;
  public parameters: TypeExpression[];
  constructor(lhs: TypeReferenceExpression, member: Token, parameters: TypeExpression[]) {
    super();
    this.lhs = lhs;
    this.member = member;
    this.parameters = parameters;
  }
  public stringifyType(): string {
    return `${this.lhs.stringifyType()}${this.member.content}<${this.parameters.map((a) => a.stringifyType()).join(", ")}>`;
  }
}
