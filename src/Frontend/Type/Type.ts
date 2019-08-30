import { Type } from "../../IR/AST";
import { TypeTreeNode } from "../Type Scope/TypeScope";

export interface IType {
  name: string;
  node: TypeTreeNode;
  irVariablesNeededForRepresentation(): number;
  irVariableTypes(): Type[];
  toString(): string;
  typeOfMember(str: string): IType | undefined;
  hasMemberCalled(str: string): boolean;
  typeOfOperator(str: string, arity: number): IType | undefined;
  hasOperatorCalled(str: string, arity: number): boolean;
  equals(other: IType): boolean;
}
