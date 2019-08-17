import * as chalk from "chalk";
import { Token, TokenTag } from "../../Lexer/Token";
import { IAttribute } from "../ASTNode";
export class TokenContentAttribute implements IAttribute {
  public kind: "type" = "type";
  public token: Token;
  constructor(token: Token) {
    this.token = token;
  }
  public toString(): string {
    if (this.token.tag === TokenTag.placeholder) {
      return chalk.default.bgRed.bold.whiteBright("<placeholder>");
    }
    return chalk.default.greenBright(this.token.content);
  }

}
