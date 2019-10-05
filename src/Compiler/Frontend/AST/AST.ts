import { IASTNode } from "./ASTNode";
import { ITypeCheckingType } from "./ExpressionType";

export interface ITopLevelDeclaration extends IASTNode {
  topLevelDeclarable: void;
}
export interface ILValue extends IASTNode {
  lvalue: undefined;
  rhsType: ITypeCheckingType | undefined;
}
