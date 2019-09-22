import { Token } from "../../Lexer/Token";
import { TypeTreeNodeTemplate } from "../../Type Scope/TypeScope";
import { StructType } from "../../Type/StructType";
import { ITopLevelDeclaration } from "../AST";
import { ASTNode } from "../ASTNode";
import { DeclarationBlock } from "./DeclarationBlock";

export class StructDeclaration extends ASTNode implements ITopLevelDeclaration {
  public topLevelDeclarable: void;
  public structKeyword: Token;
  public nameToken: Token;
  public declarationBlock: DeclarationBlock;
  public template: TypeTreeNodeTemplate | undefined;
  public typeCheckingType: StructType | undefined;
  constructor(structKeyword: Token, nameToken: Token, declarationBlock: DeclarationBlock) {
    super();
    this.structKeyword = structKeyword;
    this.nameToken = nameToken;
    this.declarationBlock = declarationBlock;
    this.children = [structKeyword, nameToken, declarationBlock];
  }
}
