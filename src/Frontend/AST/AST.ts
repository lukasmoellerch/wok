import { IType } from "../Type/Type";
import { IASTNode } from "./ASTNode";

export interface ITopLevelDeclaration extends IASTNode {
  topLevelDeclarable: void;
}
export interface ILValue extends IASTNode {
  lvalue: undefined;
  rhsType: IType | undefined;
}
