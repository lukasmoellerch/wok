import { Type } from "../../IR/AST";
import { TypeTreeNode } from "../Type Scope/TypeScope";
import { FunctionType } from "./FunctionType";
import { IType } from "./Type";
import { VoidType } from "./VoidType";
export class PointerType implements IType {
  public stored: IType;
  public name: string = "Pointer";
  public node: TypeTreeNode;
  private constructorType: FunctionType;
  private storeMemberType: FunctionType;
  private loadMemberType: FunctionType;
  constructor(node: TypeTreeNode) {
    const stored = node.resolve("Stored");
    if (stored === undefined) {
      throw new Error();
    }
    const instanceType = stored.instanceType;
    if (instanceType === undefined) {
      throw new Error();
    }
    this.stored = instanceType;
    this.node = node;
    const uint32 = node.forceResolve("UInt32").instanceType;
    if (uint32 === undefined) {
      throw new Error();
    }
    const voidType = new VoidType(node);
    this.constructorType = new FunctionType(node, [uint32], this, undefined);

    this.storeMemberType = new FunctionType(node, [this.stored], voidType, this);
    this.loadMemberType = new FunctionType(node, [], this.stored, this);
  }
  public typeOfConstructor(): FunctionType | undefined {
    return this.constructorType;
  }
  public irVariablesNeededForRepresentation(): number {
    return 1;
  }
  public irVariableTypes(): Type[] {
    return [Type.ptr];
  }
  public toString(): string {
    return this.node.toString();
  }
  public typeOfMember(str: string): IType | undefined {
    if (str === "store") {
      return this.storeMemberType;
    }
    if (str === "load") {
      return this.loadMemberType;
    }
    return undefined;
  }
  public hasMemberCalled(str: string): boolean {
    return ["store", "load"].indexOf(str) !== -1;
  }
  public typeOfOperator(_str: string, _arity: number): IType | undefined {
    return undefined;
  }
  public hasOperatorCalled(_str: string, _arity: number): boolean {
    return false;
  }
  public equals(other: IType): boolean {
    if (!(other instanceof PointerType)) {
      return false;
    }
    return other.stored.equals(this.stored);
  }

}
export class StringType implements IType {
  public name: string = "String";
  public node: TypeTreeNode;
  constructor(node: TypeTreeNode) {
    this.node = node;
  }
  public typeOfConstructor(): FunctionType | undefined {
    return undefined;
  }
  public irVariablesNeededForRepresentation(): number {
    return 2;
  }
  public irVariableTypes(): Type[] {
    return [Type.ptr, Type.ui32];
  }
  public toString(): string {
    return "String";
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
  public equals(other: IType): boolean {
    return other instanceof StringType;
  }

}
export class NativeIntegerType implements IType {
  public name: string;
  public signed: boolean;
  public bytes: number;
  public binaryOperatorType: FunctionType;
  public unaryOperatorType: FunctionType;
  public node: TypeTreeNode;
  constructor(node: TypeTreeNode, signed: boolean, bytes: number) {
    this.signed = signed;
    this.bytes = bytes;
    const prefix = signed ? "Int" : "UInt";
    const width = bytes * 8 + "";
    this.name = prefix + width;
    this.node = node;

    this.binaryOperatorType = new FunctionType(this.node.rootTypeTreeNode, [this], this, this);
    this.unaryOperatorType = new FunctionType(this.node.rootTypeTreeNode, [], this, this);
  }
  public typeOfConstructor(): FunctionType | undefined {
    return undefined;
  }
  public irVariableTypes(): Type[] {
    if (this.signed) {
      if (this.bytes === 1) {
        return [Type.si32];
      } else if (this.bytes === 2) {
        return [Type.si32];
      } else if (this.bytes === 4) {
        return [Type.si32];
      } else if (this.bytes === 8) {
        return [Type.si64];
      }
    } else {
      if (this.bytes === 1) {
        return [Type.ui32];
      } else if (this.bytes === 2) {
        return [Type.ui32];
      } else if (this.bytes === 4) {
        return [Type.ui32];
      } else if (this.bytes === 8) {
        return [Type.ui64];
      }
    }
    throw new Error("Invalid nativ einteger type");
  }
  public irVariablesNeededForRepresentation(): number {
    return 1;
  }
  public equals(other: IType): boolean {
    if (other instanceof NativeIntegerType) {
      if (this.bytes !== other.bytes || this.signed !== other.signed) {
        return false;
      }
      return true;
    }
    return false;
  }
  public typeOfOperator(str: string, arity: number): IType | undefined {
    if (arity === 0) {
      if (str === "-") {
        return this.unaryOperatorType;
      }
    } else if (arity === 1) {
      if (str === "+") {
        return this.binaryOperatorType;
      }
      if (str === "-") {
        return this.binaryOperatorType;
      }
      if (str === "*") {
        return this.binaryOperatorType;
      }
      if (str === "/") {
        return this.binaryOperatorType;
      }
      if (str === "<") {
        return this.binaryOperatorType;
      }
      if (str === ">") {
        return this.binaryOperatorType;
      }
      if (str === "<=)") {
        return this.binaryOperatorType;
      }
      if (str === ">=") {
        return this.binaryOperatorType;
      }
    }
    return undefined;
  }
  public hasOperatorCalled(str: string, arity: number): boolean {
    return this.typeOfOperator(str, arity) !== undefined;
  }
  public toString(): string {
    return this.name;
  }
  public typeOfMember(_str: string): IType | undefined {
    return undefined;
  }
  public hasMemberCalled(_str: string): boolean {
    return false;
  }
}
