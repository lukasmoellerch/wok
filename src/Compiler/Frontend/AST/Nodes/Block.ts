import { Token } from "../../Lexer/Token";
import { ASTNode } from "../ASTNode";
import { Statement } from "./Statement";
export class Block extends ASTNode {
  public startToken: Token;
  public endToken: Token;
  public statements: Statement[];
  constructor(startToken: Token, statements: Statement[], endToken: Token) {
    super();
    this.startToken = startToken;
    this.statements = statements;
    this.endToken = endToken;
    this.children = [startToken, ...statements, endToken];
  }
}
