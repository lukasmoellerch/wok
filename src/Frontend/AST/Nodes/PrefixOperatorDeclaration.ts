import { Token } from "../../Lexer/Token";
import { ITopLevelDeclaration } from "../AST";
import { ASTNode } from "../ASTNode";

export class PrefixOperatorDeclaration extends ASTNode implements ITopLevelDeclaration {
  public topLevelDeclarable: void;
  public prefixKeywordToken: Token;
  public operatorKeywordToken: Token;
  public operatorToken: Token;
  constructor(prefixKeywordToken: Token, operatorKeywordToken: Token, operatorToken: Token) {
    super();
    this.prefixKeywordToken = prefixKeywordToken;
    this.operatorKeywordToken = operatorKeywordToken;
    this.operatorToken = operatorToken;
    this.children = [prefixKeywordToken, operatorKeywordToken, operatorToken];
  }
}
