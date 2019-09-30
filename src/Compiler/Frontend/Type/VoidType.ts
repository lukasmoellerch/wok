import { Type } from "../../IR/AST";
import { TypeTreeNode } from "../Type Scope/TypeScope";
import { FunctionType } from "./FunctionType";
import { IType, MemoryLocation } from "./Type";

export class VoidType implements IType {
  public node: TypeTreeNode;
  public name: string = "void";
  constructor(node: TypeTreeNode) {
    this.node = node;
  }
  public typeReferences(): Set<IType> {
    throw new Error("Method not implemented.");
  }
  public memoryReferences(): Set<IType> {
    throw new Error("Method not implemented.");
  }
  public memoryMap(): MemoryLocation[] {
    throw new Error("Method not implemented.");
  }
  public memorySize(): number {
    throw new Error("Method not implemented.");
  }
  public typeOfConstructor(): FunctionType | undefined {
    return undefined;
  }
  public irVariableTypes(): Type[] {
    return [];
  }
  public irVariablesNeededForRepresentation(): number {
    return 0;
  }
  public equals(other: IType): boolean {
    return other instanceof VoidType;
  }
  public toString(): string {
    return "void";
  }
  public typeOfMember(_str: string): IType | undefined {
    return undefined;
  }
  public hasMemberCalled(_str: string): boolean {
    return false;
  }
  public typeOfOperator(_str: string, _arity: number): IType | undefined {
    return undefined;
  }
  public hasOperatorCalled(_str: string, _arity: number): boolean {
    return false;
  }

}
