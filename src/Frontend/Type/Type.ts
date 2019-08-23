import { TypeScope } from "../Type Scope/TypeScope";

export interface IType {
  name: string;
  scope: TypeScope;
  irVariablesNeededForRepresentation: number;
  toString(): string;
  typeOfMember(str: string): IType | undefined;
  hasMemberCalled(str: string): boolean;
  typeOfOperator(str: string, arity: number): IType | undefined;
  hasOperatorCalled(str: string, arity: number): boolean;
  equals(other: IType): boolean;
}
