import { Token } from "../../Lexer/Token";
import { ASTNode } from "../ASTNode";
import { Statement } from "./Statement";
export class Block extends ASTNode {
  public startToken: Token;
  public endToken: Token;
  public statemets: Statement[];
  constructor(startToken: Token, statements: Statement[], endToken: Token) {
    super();
    this.startToken = startToken;
    this.statemets = statements;
    this.endToken = endToken;
    this.children = statements;
  }
}
