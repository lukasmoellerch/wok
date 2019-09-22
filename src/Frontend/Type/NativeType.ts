import { MemoryIRType, Type } from "../../IR/AST";
import { TypeTreeNode } from "../Type Scope/TypeScope";
import { FunctionType } from "./FunctionType";
import { StructType } from "./StructType";
import { IType, MemoryLocation } from "./Type";
import { VoidType } from "./VoidType";
export class PointerType implements IType {
  public stored: IType;
  public name: string = "Pointer";
  public node: TypeTreeNode;
  private memoryMapData: MemoryLocation[] = [new MemoryLocation(0, MemoryIRType.ptr)];
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
  public typeReferences(): Set<IType> {
    return new Set();
  }
  public memoryReferences(): Set<IType> {
    return new Set();
  }
  public memoryMap(): MemoryLocation[] {
    return this.memoryMapData;
  }
  public memorySize(): number {
    return 8;
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
    if (this.stored instanceof StructType) {
      const memberType = this.stored.typeOfMember(str);
      if (memberType instanceof StructType) {
        const parent = this.node.parent;
        if (parent === undefined) {
          throw new Error();
        }
        const ptrType = parent.forceResolve("Pointer", [memberType.node]).forceInstanceType();
        return ptrType;
      } else {
        return memberType;
      }
    }
    return undefined;
  }
  public hasMemberCalled(str: string): boolean {
    if (str === "store") {
      return true;
    }
    if (str === "load") {
      return true;
    }
    if (this.stored instanceof StructType) {
      return this.stored.hasMemberCalled(str);
    }
    return false;
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
  public pointerIndex = 0;
  public lengthIndex = 1;
  private memoryMapData: MemoryLocation[] =
    [new MemoryLocation(0, MemoryIRType.ptr), new MemoryLocation(8, MemoryIRType.ui32)];
  private uint32Type: IType;
  private getType: FunctionType;
  constructor(node: TypeTreeNode) {
    this.node = node;
    this.uint32Type = node.forceResolve("UInt32").forceInstanceType();
    const uint8Type = node.forceResolve("UInt8").forceInstanceType();
    this.getType = new FunctionType(node.rootTypeTreeNode, [this.uint32Type], uint8Type, this);
  }
  public typeReferences(): Set<IType> {
    return new Set();
  }
  public memoryReferences(): Set<IType> {
    return new Set();
  }
  public memoryMap(): MemoryLocation[] {
    return this.memoryMapData;
  }
  public memorySize(): number {
    return 12;
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
  public typeOfMember(str: string): IType | undefined {
    if (str === "length") {
      return this.uint32Type;
    } else if (str === "get") {
      return this.getType;
    }
    return undefined;
  }
  public hasMemberCalled(str: string): boolean {
    if (str === "length") {
      return true;
    } else if (str === "get") {
      return true;
    }
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
  public node: TypeTreeNode;
  private binaryOperatorType: FunctionType;
  private unaryOperatorType: FunctionType;
  private memoryMapData: MemoryLocation[];
  private sizeData: number;
  constructor(node: TypeTreeNode, signed: boolean, bytes: number) {
    this.signed = signed;
    this.bytes = bytes;
    const prefix = signed ? "Int" : "UInt";
    const width = bytes * 8 + "";
    this.name = prefix + width;
    this.node = node;

    this.binaryOperatorType = new FunctionType(this.node.rootTypeTreeNode, [this], this, this);
    this.unaryOperatorType = new FunctionType(this.node.rootTypeTreeNode, [], this, this);

    let memoryType: MemoryIRType | undefined;
    if (this.signed && this.bytes === 1) {
      memoryType = MemoryIRType.si8;
    } else if (this.signed && this.bytes === 2) {
      memoryType = MemoryIRType.si16;
    } else if (this.signed && this.bytes === 4) {
      memoryType = MemoryIRType.si32;
    } else if (this.signed && this.bytes === 8) {
      memoryType = MemoryIRType.si64;
    } else if (!this.signed && this.bytes === 1) {
      memoryType = MemoryIRType.ui8;
    } else if (!this.signed && this.bytes === 2) {
      memoryType = MemoryIRType.ui16;
    } else if (!this.signed && this.bytes === 4) {
      memoryType = MemoryIRType.ui32;
    } else if (!this.signed && this.bytes === 8) {
      memoryType = MemoryIRType.ui64;
    }
    this.sizeData = this.bytes;
    if (memoryType === undefined) {
      throw new Error();
    }

    this.memoryMapData = [new MemoryLocation(0, memoryType)];
  }
  public typeReferences(): Set<IType> {
    return new Set();
  }
  public memoryReferences(): Set<IType> {
    return new Set();
  }
  public memoryMap(): MemoryLocation[] {
    return this.memoryMapData;
  }
  public memorySize(): number {
    return this.sizeData;
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
    throw new Error("Invalid native integer type");
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
      if (str === "==") {
        return this.binaryOperatorType;
      }
      if (str === "!=") {
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
