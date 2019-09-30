import { Token } from "../../Lexer/Token";
import { Expression } from "./Expression";

export class MemberCallExpression extends Expression {
  public lhs: Expression;
  public memberToken: Token;
  public args: Expression[];
  constructor(lhs: Expression, memberToken: Token, args: Expression[]) {
    super();
    this.lhs = lhs;
    this.memberToken = memberToken;
    this.args = args;
    this.children = [lhs, memberToken, ...args];
  }
  public addImplictConversionsToChildren() {
    this.lhs = this.lhs.addImplictConversionIfNeeded();
    this.args = this.args.map((a) => a.addImplictConversionIfNeeded());
    this.children = [this.lhs, this.memberToken, ...this.args];
  }
}
