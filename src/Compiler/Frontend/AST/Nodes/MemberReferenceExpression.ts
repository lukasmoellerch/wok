import { Token } from "../../Lexer/Token";
import { IType } from "../../Type/Type";
import { ILValue } from "../AST";
import { Expression } from "./Expression";

export class MemberReferenceExpression extends Expression implements ILValue {
  public lvalue: undefined = undefined;
  public rhsType: IType | undefined;
  public lhs: Expression;
  public memberToken: Token;
  constructor(lhs: Expression, memberToken: Token) {
    super();
    this.lhs = lhs;
    this.memberToken = memberToken;
    this.children = [lhs, memberToken];
  }
  public addImplictConversionsToChildren() {
    this.lhs = this.lhs.addImplictConversionIfNeeded();
    this.children = [this.lhs, this.memberToken];
  }
}
