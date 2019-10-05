import { Type } from "../../IR/AST";
import { GenericTypeVariableScope, ITypeCheckingType } from "../AST/ExpressionType";
import { SpecializedTypeReference } from "../Type Scope/TypeProvider";
import { TypeTreeNode } from "../Type Scope/TypeScope";
import { FunctionType, TypeCheckingFunctionType } from "./FunctionType";
import { IType, MemoryLocation } from "./Type";
export class TypeCheckingVoidType implements ITypeCheckingType {
  public name: string = "Void";
  constructor(
    public node: TypeTreeNode,
  ) {

  }
  public equals(_other: ITypeCheckingType): boolean {
    throw new Error("Method not implemented.");
  }
  public typeOfConstructor(): TypeCheckingFunctionType | undefined {
    throw new Error("Method not implemented.");
  }
  public typeOfMember(_str: string): ITypeCheckingType | undefined {
    throw new Error("Method not implemented.");
  }
  public typeOfOperator(_str: string): ITypeCheckingType | undefined {
    throw new Error("Method not implemented.");
  }
  public compilationType(_provider: import("../Type Scope/TypeProvider").TypeProvider, _scope: GenericTypeVariableScope): SpecializedTypeReference {
    return new SpecializedTypeReference(-1);
  }
}
export class VoidType implements IType {
  public name: string = "void";
  constructor() {
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
