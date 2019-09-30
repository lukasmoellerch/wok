import { Token } from "../../Lexer/Token";
import { TypeTreeNodeTemplate } from "../../Type Scope/TypeScope";
import { ClassType } from "../../Type/ClassType";
import { ITopLevelDeclaration } from "../AST";
import { ASTNode } from "../ASTNode";
import { DeclarationBlock } from "./DeclarationBlock";

export class ClassDeclaration extends ASTNode implements ITopLevelDeclaration {
  public topLevelDeclarable: void;
  public classKeyword: Token;
  public nameToken: Token;
  public declarationBlock: DeclarationBlock;
  public template: TypeTreeNodeTemplate | undefined;
  public typeCheckingType: ClassType | undefined;
  constructor(classKeyword: Token, nameToken: Token, declarationBlock: DeclarationBlock) {
    super();
    this.classKeyword = classKeyword;
    this.nameToken = nameToken;
    this.declarationBlock = declarationBlock;
    this.children = [classKeyword, nameToken, declarationBlock];
  }
}
