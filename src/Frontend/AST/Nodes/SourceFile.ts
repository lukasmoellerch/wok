import { ITopLevelDeclaration } from "../AST";
import { ASTNode } from "../ASTNode";

export class SourceFile extends ASTNode {
  constructor(topLevelDeclarations: ITopLevelDeclaration[]) {
    super();
    this.children = topLevelDeclarations;
  }
}
