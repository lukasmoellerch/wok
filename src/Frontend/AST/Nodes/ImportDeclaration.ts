import { Token } from "../../Lexer/Token";
import { ITopLevelDeclaration } from "../AST";
import { ASTNode } from "../ASTNode";

export class ImportDelaraction extends ASTNode implements ITopLevelDeclaration {
  public topLevelDeclarable: void;
  private importKeyword: Token;
  constructor(importKeyword: Token) {
    super();
    this.importKeyword = importKeyword;
  }
}
