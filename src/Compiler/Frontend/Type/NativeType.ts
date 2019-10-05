import { MemoryIRType, Type } from "../../IR/AST";
import { GenericTypeVariableScope, ITypeCheckingType } from "../AST/ExpressionType";
import { GenericTypeIdentifier, IGenericTypeTemplate, NonGenericTypeTemplate, SpecializedTypeReference, TypeProvider } from "../Type Scope/TypeProvider";
import { TypeTreeNode } from "../Type Scope/TypeScope";
import { functionTemplate, FunctionType, TypeCheckingFunctionType } from "./FunctionType";
import { StructType } from "./StructType";
import { IType, MemoryLocation } from "./Type";
import { TypeCheckingVoidType } from "./VoidType";
class PointerGenericTypeTemplate implements IGenericTypeTemplate {
  public argsNeeded: number = 1;
  constructor(public identifier: GenericTypeIdentifier) {

  }
  public createWithArguments(provider: TypeProvider, thisRef: SpecializedTypeReference, args: SpecializedTypeReference[]): IType {
    return new PointerType(provider, thisRef, args[0]);
  }
}
export const pointerIdentifier = new GenericTypeIdentifier("Pointer");
export const pointerTemplate = new PointerGenericTypeTemplate(pointerIdentifier);
export class TypeCheckingPointerType implements ITypeCheckingType {
  public get name(): string {
    return this.node.toString();
  }
  constructor(
    public node: TypeTreeNode,
    public stored: ITypeCheckingType,
  ) {

  }
  public compilationType(provider: TypeProvider, scope: GenericTypeVariableScope): SpecializedTypeReference {
    const stored = this.stored.compilationType(provider, scope);
    return provider.specialize(pointerTemplate, [stored]);
  }
  public equals(other: ITypeCheckingType): boolean {
    if (!(other instanceof TypeCheckingPointerType)) {
      return false;
    }
    return this.stored.equals(other.stored);
  }
  public typeOfConstructor(): TypeCheckingFunctionType | undefined {
    return new TypeCheckingFunctionType(this.node, [new TypeCheckingNativeIntegerType(this.node, false, 4)], this, undefined);
  }
  public typeOfMember(str: string): ITypeCheckingType | undefined {
    if (str === "load") {
      return new TypeCheckingFunctionType(this.node, [], this.stored, this);
    }
    if (str === "store") {
      return new TypeCheckingFunctionType(this.node, [this.stored], new TypeCheckingVoidType(this.node), this);
    }
    return undefined;
  }
  public typeOfOperator(_str: string): ITypeCheckingType | undefined {
    return undefined;
  }
}

export class PointerType implements IType {
  public stored: SpecializedTypeReference;
  public name: string = "Pointer";
  private memoryMapData: MemoryLocation[] = [new MemoryLocation(0, MemoryIRType.ptr)];
  private constructorType: SpecializedTypeReference;
  private storeMemberType: SpecializedTypeReference;
  private loadMemberType: SpecializedTypeReference;
  constructor(private provider: TypeProvider, thisRef: SpecializedTypeReference, stored: SpecializedTypeReference) {
    this.stored = stored;
    const uint32 = provider.specialize(uint32Template);
    if (uint32 === undefined) {
      throw new Error();
    }
    const voidType = provider.voidIdentifier;
    this.constructorType = provider.specialize(functionTemplate, [voidType, thisRef]);
    this.storeMemberType = provider.specialize(functionTemplate, [thisRef, voidType, stored]);
    this.loadMemberType = provider.specialize(functionTemplate, [thisRef, stored]);
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
    return this.provider.get(this.constructorType) as FunctionType;
  }
  public irVariablesNeededForRepresentation(): number {
    return 1;
  }
  public irVariableTypes(): Type[] {
    return [Type.ptr];
  }
  public toString(): string {
    return `Pointer<${this.stored.index}>`;
  }
  public typeOfMember(str: string): IType | undefined {
    if (str === "store") {
      return this.provider.get(this.storeMemberType);
    }
    if (str === "load") {
      return this.provider.get(this.loadMemberType);
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

}

export class TypeCheckingStringType implements ITypeCheckingType {
  public name: string = "String";
  constructor(
    public node: TypeTreeNode,
  ) { }
  public equals(other: ITypeCheckingType): boolean {
    return other instanceof TypeCheckingStringType;
  }
  public typeOfConstructor(): TypeCheckingFunctionType | undefined {
    return undefined;
  }
  public typeOfMember(str: string): ITypeCheckingType | undefined {
    if (str === "length") {
      return new TypeCheckingFunctionType(this.node, [], new TypeCheckingNativeIntegerType(this.node, false, 4), this);
    }
    return undefined;
  }
  public typeOfOperator(_str: string): ITypeCheckingType | undefined {
    return undefined;
  }
  public compilationType(provider: TypeProvider, _scope: GenericTypeVariableScope): SpecializedTypeReference {
    return provider.specialize(stringTemplate, []);
  }
}

export class StringType implements IType {
  public name: string = "String";
  public pointerIndex = 0;
  public lengthIndex = 1;
  private memoryMapData: MemoryLocation[] =
    [new MemoryLocation(0, MemoryIRType.ptr), new MemoryLocation(8, MemoryIRType.ui32)];
  private uint32Type: SpecializedTypeReference;
  private getType: SpecializedTypeReference;
  constructor(private provider: TypeProvider, thisRef: SpecializedTypeReference) {
    this.uint32Type = provider.specialize(uint32Template);
    const uint8Type = provider.specialize(uint8Template);
    this.getType = provider.specialize(functionTemplate, [thisRef, uint8Type, this.uint32Type]);
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
    return this.name;
  }
  public typeOfMember(str: string): IType | undefined {
    if (str === "length") {
      return this.provider.get(this.uint32Type);
    } else if (str === "get") {
      return this.provider.get(this.getType);
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
export const stringIdentifier = new GenericTypeIdentifier("String");
export const stringTemplate = new NonGenericTypeTemplate(stringIdentifier, StringType);

export class TypeCheckingNativeIntegerType implements ITypeCheckingType {
  public name: string;
  constructor(
    public node: TypeTreeNode,
    public signed: boolean,
    public bytes: number,
  ) {
    const prefix = signed ? "Int" : "UInt";
    const width = bytes * 8 + "";
    this.name = prefix + width;
  }
  public equals(other: ITypeCheckingType): boolean {
    if (!(other instanceof TypeCheckingNativeIntegerType)) {
      return false;
    }
    return other.signed === this.signed && this.bytes === this.bytes;
  }
  public typeOfConstructor(): TypeCheckingFunctionType | undefined {
    return undefined;
  }
  public typeOfMember(_str: string): ITypeCheckingType | undefined {
    return undefined;
  }
  public typeOfOperator(str: string): ITypeCheckingType | undefined {
    if (str === "-") {
      return new TypeCheckingFunctionType(this.node, [this], this, this);
    }
    if (str === "+") {
      return new TypeCheckingFunctionType(this.node, [this], this, this);
    }
    if (str === "*") {
      return new TypeCheckingFunctionType(this.node, [this], this, this);
    }
    if (str === "/") {
      return new TypeCheckingFunctionType(this.node, [this], this, this);
    }
    if (str === "<") {
      return new TypeCheckingFunctionType(this.node, [this], new TypeCheckingNativeIntegerType(this.node, false, 1), this);
    }
    if (str === ">") {
      return new TypeCheckingFunctionType(this.node, [this], new TypeCheckingNativeIntegerType(this.node, false, 1), this);
    }
    if (str === "<=)") {
      return new TypeCheckingFunctionType(this.node, [this], new TypeCheckingNativeIntegerType(this.node, false, 1), this);
    }
    if (str === ">=") {
      return new TypeCheckingFunctionType(this.node, [this], new TypeCheckingNativeIntegerType(this.node, false, 1), this);
    }
    if (str === "==") {
      return new TypeCheckingFunctionType(this.node, [this], new TypeCheckingNativeIntegerType(this.node, false, 1), this);
    }
    if (str === "!=") {
      return new TypeCheckingFunctionType(this.node, [this], new TypeCheckingNativeIntegerType(this.node, false, 1), this);
    }
    return undefined;
  }
  public compilationType(provider: TypeProvider, _scope: GenericTypeVariableScope): SpecializedTypeReference {
    if (this.signed) {
      if (this.bytes === 1) {
        return provider.specialize(int8Template, []);
      } else if (this.bytes === 2) {
        return provider.specialize(int16Template, []);
      } else if (this.bytes === 4) {
        return provider.specialize(int32Template, []);
      } else if (this.bytes === 8) {
        return provider.specialize(int64Template, []);
      }
    } else {
      if (this.bytes === 1) {
        return provider.specialize(uint8Template, []);
      } else if (this.bytes === 2) {
        return provider.specialize(uint16Template, []);
      } else if (this.bytes === 4) {
        return provider.specialize(uint32Template, []);
      } else if (this.bytes === 8) {
        return provider.specialize(uint64Template, []);
      }
    }
    throw new Error();
  }
}

export class NativeIntegerType implements IType {
  public name: string;
  public signed: boolean;
  public bytes: number;
  private binaryOperatorType: SpecializedTypeReference;
  private unaryOperatorType: SpecializedTypeReference;
  private memoryMapData: MemoryLocation[];
  private sizeData: number;
  constructor(private provider: TypeProvider, private thisRef: SpecializedTypeReference, signed: boolean, bytes: number) {
    this.signed = signed;
    this.bytes = bytes;
    const prefix = signed ? "Int" : "UInt";
    const width = bytes * 8 + "";
    this.name = prefix + width;

    this.binaryOperatorType = provider.specialize(functionTemplate, [thisRef, thisRef, thisRef]);

    this.unaryOperatorType = provider.specialize(functionTemplate, [thisRef, thisRef]);

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
        return this.provider.get(this.unaryOperatorType);
      }
    } else if (arity === 1) {
      if (str === "+") {
        return this.provider.get(this.binaryOperatorType);
      }
      if (str === "-") {
        return this.provider.get(this.binaryOperatorType);
      }
      if (str === "*") {
        return this.provider.get(this.binaryOperatorType);
      }
      if (str === "/") {
        return this.provider.get(this.binaryOperatorType);
      }
      if (str === "<") {
        return this.provider.get(this.binaryOperatorType);
      }
      if (str === ">") {
        return this.provider.get(this.binaryOperatorType);
      }
      if (str === "<=)") {
        return this.provider.get(this.binaryOperatorType);
      }
      if (str === ">=") {
        return this.provider.get(this.binaryOperatorType);
      }
      if (str === "==") {
        return this.provider.get(this.binaryOperatorType);
      }
      if (str === "!=") {
        return this.provider.get(this.binaryOperatorType);
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
export class UInt8Type extends NativeIntegerType {
  constructor(provider: TypeProvider, thisRef: SpecializedTypeReference) {
    super(provider, thisRef, false, 1);
  }
}
export const uint8Identifier = new GenericTypeIdentifier("UInt8");
export const uint8Template = new NonGenericTypeTemplate(uint8Identifier, UInt8Type);

export class UInt16Type extends NativeIntegerType {
  constructor(provider: TypeProvider, thisRef: SpecializedTypeReference) {
    super(provider, thisRef, false, 2);
  }
}
export const uint16Identifier = new GenericTypeIdentifier("UInt16");
export const uint16Template = new NonGenericTypeTemplate(uint16Identifier, UInt16Type);

export class UInt32Type extends NativeIntegerType {
  constructor(provider: TypeProvider, thisRef: SpecializedTypeReference) {
    super(provider, thisRef, false, 4);
  }
}
export const uint32Identifier = new GenericTypeIdentifier("UInt32");
export const uint32Template = new NonGenericTypeTemplate(uint32Identifier, UInt32Type);

export class UInt64Type extends NativeIntegerType {
  constructor(provider: TypeProvider, thisRef: SpecializedTypeReference) {
    super(provider, thisRef, false, 8);
  }
}
export const uint64Identifier = new GenericTypeIdentifier("UInt64");
export const uint64Template = new NonGenericTypeTemplate(uint64Identifier, UInt64Type);

export class Int8Type extends NativeIntegerType {
  constructor(provider: TypeProvider, thisRef: SpecializedTypeReference) {
    super(provider, thisRef, true, 1);
  }
}
export const int8Identifier = new GenericTypeIdentifier("Int8");
export const int8Template = new NonGenericTypeTemplate(int8Identifier, Int8Type);

export class Int16Type extends NativeIntegerType {
  constructor(provider: TypeProvider, thisRef: SpecializedTypeReference) {
    super(provider, thisRef, true, 2);
  }
}
export const int16Identifier = new GenericTypeIdentifier("Int16");
export const int16Template = new NonGenericTypeTemplate(int16Identifier, Int16Type);

export class Int32Type extends NativeIntegerType {
  constructor(provider: TypeProvider, thisRef: SpecializedTypeReference) {
    super(provider, thisRef, true, 4);
  }
}
export const int32Identifier = new GenericTypeIdentifier("Int32");
export const int32Template = new NonGenericTypeTemplate(int32Identifier, Int32Type);

export class Int64Type extends NativeIntegerType {
  constructor(provider: TypeProvider, thisRef: SpecializedTypeReference) {
    super(provider, thisRef, true, 8);
  }
}
export const int64Identifier = new GenericTypeIdentifier("Int64");
export const int64Template = new NonGenericTypeTemplate(int64Identifier, Int64Type);
