import { VariableScopeEntry } from "../../VariableScope/VariableScope";
import { ITopLevelDeclaration } from "../AST";
import { ASTNode } from "../ASTNode";

export class SourceFile extends ASTNode {
  public name = "SourceFile";
  public topLevelDeclarations: ITopLevelDeclaration[];
  public variables: VariableScopeEntry[] = [];
  constructor(topLevelDeclarations: ITopLevelDeclaration[]) {
    super();
    this.children = topLevelDeclarations;
    this.topLevelDeclarations = topLevelDeclarations;
  }
}
