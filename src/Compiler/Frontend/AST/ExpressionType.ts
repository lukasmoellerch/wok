import { SpecializedTypeReference, TypeProvider } from "../Type Scope/TypeProvider";
import { TypeTreeNode } from "../Type Scope/TypeScope";
import { TypeCheckingFunctionType } from "../Type/FunctionType";
export class GenericTypeVariableScope {
  public parent: GenericTypeVariableScope | undefined;
  public map: Map<string, SpecializedTypeReference> = new Map();
  constructor(parent?: GenericTypeVariableScope) {
    this.parent = parent;
  }
  public reolve(str: string): SpecializedTypeReference | undefined {
    const type = this.map.get(str);
    if (type !== undefined) {
      return type;
    }
    const parent = this.parent;
    if (parent !== undefined) {
      return parent.reolve(str);
    }
    return undefined;
  }
}
export interface ITypeCheckingType {
  node: TypeTreeNode;
  name: string;
  equals(other: ITypeCheckingType): boolean;
  typeOfConstructor(): TypeCheckingFunctionType | undefined;
  typeOfMember(str: string): ITypeCheckingType | undefined;
  typeOfOperator(str: string): ITypeCheckingType | undefined;
  compilationType(provider: TypeProvider, scope: GenericTypeVariableScope): SpecializedTypeReference;
  applyMapping(map: Map<string, ITypeCheckingType>): ITypeCheckingType;
}
export function applyGenericTypeVariableScope(map: Map<string, ITypeCheckingType>, type: ITypeCheckingType): ITypeCheckingType {
  if (type instanceof TypeVariable) {
    const name = type.name;
    const t = map.get(name);
    if (t === undefined) {
      return type;
    } else {
      return type;
    }
  } else {
    return type;
  }
}
export class TypeVariable implements ITypeCheckingType {
  constructor(
    public node: TypeTreeNode,
    public name: string,
    private constraints?: ITypeCheckingType,
  ) { }
  public applyMapping(map: Map<string, ITypeCheckingType>): ITypeCheckingType {
    const t = map.get(this.name);
    if (t !== undefined) {
      return t;
    }
    return this;
  }
  public compilationType(_provider: TypeProvider, scope: GenericTypeVariableScope): SpecializedTypeReference {
    const s = scope.reolve(this.name);
    if (s === undefined) {
      throw new Error();
    }
    return s;
  }
  public equals(other: ITypeCheckingType): boolean {
    if (!(other instanceof TypeVariable)) {
      return false;
    }
    return this.name === other.name;
  }
  public typeOfConstructor(): TypeCheckingFunctionType | undefined {
    const constraints = this.constraints;
    if (constraints === undefined) {
      return undefined;
    }
    return constraints.typeOfConstructor();
  }
  public typeOfMember(str: string): ITypeCheckingType | undefined {
    const constraints = this.constraints;
    if (constraints === undefined) {
      return undefined;
    }
    return constraints.typeOfMember(str);
  }
  public typeOfOperator(str: string): ITypeCheckingType | undefined {
    const constraints = this.constraints;
    if (constraints === undefined) {
      return undefined;
    }
    return constraints.typeOfOperator(str);
  }
}
