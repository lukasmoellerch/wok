import { ITopLevelDeclaration } from "../AST";
import { ASTNode } from "../ASTNode";
export class Statement extends ASTNode implements ITopLevelDeclaration {
  public name = "Statement";
  public topLevelDeclarable: void = undefined;
}
