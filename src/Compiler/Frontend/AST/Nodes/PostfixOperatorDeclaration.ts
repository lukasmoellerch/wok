import { Token } from "../../Lexer/Token";
import { ITopLevelDeclaration } from "../AST";
import { ASTNode } from "../ASTNode";

export class PostfixOperatorDeclaration extends ASTNode implements ITopLevelDeclaration {
  public name = "PostfixOperatorDeclaration";
  public topLevelDeclarable: void;
  public postfixKeywordToken: Token;
  public operatorKeywordToken: Token;
  public operatorToken: Token;
  constructor(postfixKeywordToken: Token, operatorKeywordToken: Token, operatorToken: Token) {
    super();
    this.postfixKeywordToken = postfixKeywordToken;
    this.operatorKeywordToken = operatorKeywordToken;
    this.operatorToken = operatorToken;
    this.children = [postfixKeywordToken, operatorKeywordToken, operatorToken];
  }
}
