import { IASTNode } from "./ASTNode";

export interface ITopLevelDeclaration extends IASTNode {
  topLevelDeclarable: void;
}
