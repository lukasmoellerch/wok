import { Token } from "../../Lexer/Token";
import { ITopLevelDeclaration } from "../AST";
import { ASTNode } from "../ASTNode";

export class ImportDelaraction extends ASTNode implements ITopLevelDeclaration {
  public name = "ImportDelaraction";
  public topLevelDeclarable: void;
  public importKeyword: Token;
  constructor(importKeyword: Token) {
    super();
    this.importKeyword = importKeyword;
    this.children = [importKeyword];
  }
}
