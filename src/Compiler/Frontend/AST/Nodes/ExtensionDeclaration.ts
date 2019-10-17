import { Token } from "../../Lexer/Token";
import { TypeExpressionWrapper } from "../../Type/UnresolvedType/TypeExpressionWrapper";
import { ITopLevelDeclaration } from "../AST";
import { ASTNode } from "../ASTNode";
import { DeclarationBlock } from "./DeclarationBlock";

export class ExtensionDeclaration extends ASTNode implements ITopLevelDeclaration {
  public name = "ExtensionDeclaration";
  public topLevelDeclarable: void = undefined;
  public extensionKeywordToken: Token;
  public typeExpression: TypeExpressionWrapper;
  public declarationBlock: DeclarationBlock;
  constructor(extensionKeywordToken: Token, typeExpression: TypeExpressionWrapper, declarationBlock: DeclarationBlock) {
    super();
    this.extensionKeywordToken = extensionKeywordToken;
    this.typeExpression = typeExpression;
    this.declarationBlock = declarationBlock;
    this.children = [extensionKeywordToken, typeExpression, declarationBlock];
  }
}
