import { Token } from "../../Lexer/Token";
import { TypeExpressionWrapper } from "../../Type/UnresolvedType/TypeExpressionWrapper";
import { ASTNode } from "../ASTNode";

export class VariableFieldDeclaration extends ASTNode {
  public name = "VariableFieldDeclaration";
  public keywordToken: Token;
  public nameToken: Token;
  public typeHint: TypeExpressionWrapper;
  constructor(keywordToken: Token, nameToken: Token, typeHint: TypeExpressionWrapper) {
    super();
    this.keywordToken = keywordToken;
    this.nameToken = nameToken;
    this.typeHint = typeHint;
    this.children = [keywordToken, nameToken, typeHint];
  }
}
