import { Token } from "../../Lexer/Token";
import { Expression } from "./Expression";
import { Statement } from "./Statement";
export class ExpressionWrapper extends Statement {
  public parsed: boolean = false;
  public tokens: Token[];
  public expression: Expression | undefined = undefined;
  constructor(tokens: Token[]) {
    super();
    this.tokens = tokens;
    this.children = tokens;
  }
}
