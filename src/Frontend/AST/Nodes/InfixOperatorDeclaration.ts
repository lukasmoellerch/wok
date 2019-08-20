import { Token } from "../../Lexer/Token";
import { ITopLevelDeclaration } from "../AST";
import { ASTNode } from "../ASTNode";

export class InfixOperatorDeclaration extends ASTNode implements ITopLevelDeclaration {
  public topLevelDeclarable: void;
  public infixKeywordToken: Token;
  public operatorKeywordToken: Token;
  public operatorToken: Token;
  public precedenceToken: Token;
  public associativityToken: Token;
  constructor(infixKeywordToken: Token, operatorKeywordToken: Token, operatorToken: Token, precedenceToken: Token, associativityToken: Token) {
    super();
    this.infixKeywordToken = infixKeywordToken;
    this.operatorKeywordToken = operatorKeywordToken;
    this.operatorToken = operatorToken;
    this.precedenceToken = precedenceToken;
    this.associativityToken = associativityToken;
    this.children = [infixKeywordToken, operatorKeywordToken, operatorToken, precedenceToken, associativityToken];
  }
}
