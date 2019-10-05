import { MemoryIRType, Type } from "../../IR/AST";
import { FunctionType } from "./FunctionType";

export class MemoryLocation {
  constructor(public baseOffset: number, public memoryType: MemoryIRType) { }
}
export interface IType {
  name: string;
  irVariablesNeededForRepresentation(): number;
  irVariableTypes(): Type[];
  toString(): string;

  memoryMap(): MemoryLocation[];
  memorySize(): number; // In Bytes

  typeReferences(): Set<IType>;
  memoryReferences(): Set<IType>;

  typeOfConstructor(): FunctionType | undefined;

  typeOfMember(str: string): IType | undefined;
  hasMemberCalled(str: string): boolean;

  typeOfOperator(str: string, arity: number): IType | undefined;
  hasOperatorCalled(str: string, arity: number): boolean;
}
