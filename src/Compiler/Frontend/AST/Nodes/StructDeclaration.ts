import { Token } from "../../Lexer/Token";
import { TypeTreeNodeTemplate } from "../../Type Scope/TypeScope";
import { TypeCheckingStructType } from "../../Type/StructType";
import { ITopLevelDeclaration } from "../AST";
import { ASTNode } from "../ASTNode";
import { DeclarationBlock } from "./DeclarationBlock";

export class StructDeclaration extends ASTNode implements ITopLevelDeclaration {
  public name = "StructDeclarations";
  public topLevelDeclarable: void;
  public structKeyword: Token;
  public nameToken: Token;
  public declarationBlock: DeclarationBlock;
  public genericVariables: Token[];
  public template: TypeTreeNodeTemplate | undefined;
  public typeCheckingType: TypeCheckingStructType | undefined;
  constructor(structKeyword: Token, nameToken: Token, genericVariables: Token[], declarationBlock: DeclarationBlock) {
    super();
    this.genericVariables = genericVariables;
    this.structKeyword = structKeyword;
    this.nameToken = nameToken;
    this.declarationBlock = declarationBlock;
    this.children = [structKeyword, nameToken, ...genericVariables, declarationBlock];
  }
}
