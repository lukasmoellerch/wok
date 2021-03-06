import { Token } from "../../Lexer/Token";
import { TypeTreeNodeTemplate } from "../../Type Scope/TypeScope";
import { TypeCheckingClassType } from "../../Type/ClassType";
import { ITopLevelDeclaration } from "../AST";
import { ASTNode } from "../ASTNode";
import { DeclarationBlock } from "./DeclarationBlock";

export class ClassDeclaration extends ASTNode implements ITopLevelDeclaration {
  public name = "ClassDeclaration";
  public topLevelDeclarable: void;
  public classKeyword: Token;
  public nameToken: Token;
  public declarationBlock: DeclarationBlock;
  public genericVariables: Token[];
  public template: TypeTreeNodeTemplate | undefined;
  public typeCheckingType: TypeCheckingClassType | undefined;
  constructor(classKeyword: Token, nameToken: Token, genericVariables: Token[], declarationBlock: DeclarationBlock) {
    super();
    this.genericVariables = genericVariables;
    this.classKeyword = classKeyword;
    this.nameToken = nameToken;
    this.declarationBlock = declarationBlock;
    this.children = [classKeyword, nameToken, declarationBlock];
  }
}
