import { ITopLevelDeclaration } from "../AST";
import { ASTNode } from "../ASTNode";

export class SourceFile extends ASTNode {
  public topLevelDeclarations: ITopLevelDeclaration[];
  constructor(topLevelDeclarations: ITopLevelDeclaration[]) {
    super();
    this.children = topLevelDeclarations;
    this.topLevelDeclarations = topLevelDeclarations;
  }
}
