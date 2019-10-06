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
  public equals(other: ITypeCheckingType): boolean {
    return other instanceof TypeCheckingVoidType;
  }
  public typeOfConstructor(): TypeCheckingFunctionType | undefined {
    return undefined;
  }
  public typeOfMember(_str: string): ITypeCheckingType | undefined {
    return undefined;
  }
  public typeOfOperator(_str: string): ITypeCheckingType | undefined {
    return undefined;
  }
  public compilationType(_provider: import("../Type Scope/TypeProvider").TypeProvider, _scope: GenericTypeVariableScope): SpecializedTypeReference {
    return new SpecializedTypeReference(-1);
  }
}
export class VoidType implements IType {
  public name: string = "void";
  public typeReferences(): Set<IType> {
    return new Set();
  }
  public memoryReferences(): Set<IType> {
    return new Set();
  }
  public memoryMap(): MemoryLocation[] {
    return [];
  }
  public memorySize(): number {
    return 0;
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
