import { MemoryIRType, Type } from "../../IR/AST";
import { GenericTypeVariableScope, ITypeCheckingType } from "../AST/ExpressionType";
import { ClassDeclaration } from "../AST/Nodes/ClassDeclaration";
import { ConstantFieldDeclaration } from "../AST/Nodes/ConstantFieldDeclaration";
import { MethodDeclaration } from "../AST/Nodes/MethodDeclaration";
import { VariableFieldDeclaration } from "../AST/Nodes/VariableFieldDeclaration";
import { SpecializedTypeReference, TypeProvider } from "../Type Scope/TypeProvider";
import { TypeTreeNode } from "../Type Scope/TypeScope";
import { FunctionType, TypeCheckingFunctionType } from "./FunctionType";
import { IType, MemoryLocation } from "./Type";
export class TypeCheckingClassType implements ITypeCheckingType {
  public declaration: ClassDeclaration;
  public node: TypeTreeNode;
  public name: string;
  public memberMap: Map<string, ITypeCheckingType> = new Map();
  public operatorMap: Map<string, ITypeCheckingType> = new Map();
  constructor(name: string, node: TypeTreeNode, declaration: ClassDeclaration) {
    this.name = name;
    this.node = node;
    this.declaration = declaration;
    for (const decl of declaration.declarationBlock.declarations) {
      if (decl instanceof MethodDeclaration) {
        this.memberMap.set(decl.name.content, decl.getFunctionType(this.node, this));
      }
      if (decl instanceof VariableFieldDeclaration) {
        this.memberMap.set(decl.nameToken.content, decl.typeHint.type as ITypeCheckingType);
      }
      if (decl instanceof ConstantFieldDeclaration) {
        this.memberMap.set(decl.nameToken.content, decl.typeHint.type as ITypeCheckingType);
      }

    }
  }
  public equals(_other: ITypeCheckingType): boolean {
    return false;
  }
  public typeOfConstructor(): TypeCheckingFunctionType | undefined {
    return undefined;
  }
  public typeOfMember(_str: string): ITypeCheckingType | undefined {
    return;
  }
  public typeOfOperator(_str: string): ITypeCheckingType | undefined {
    throw new Error("Method not implemented.");
  }
  public compilationType(_provider: TypeProvider, _scope: GenericTypeVariableScope): SpecializedTypeReference {
    throw new Error("Method not implemented.");
  }
}
export class ClassType implements IType {
  public name: string;
  public node: TypeTreeNode;
  public declaration: ClassDeclaration;
  public constructorDeclaration: undefined;
  public properties: string[] = [];
  public propertyTypeMap: Map<string, IType> = new Map();
  public irVariableTypesCache: Type[] = [];
  public propertyMappingPopulated = false;
  public methodDeclarationMap: Map<string, MethodDeclaration> = new Map();
  public instanceMemoryMapData: Map<string, MemoryLocation> = new Map();
  public instanceSizeData: number = -1;
  private memoryMapData: MemoryLocation[] = [
    new MemoryLocation(0, MemoryIRType.ptr),
  ];
  private sizeData: number = 8;
  private genericVariableScope: GenericTypeVariableScope = new GenericTypeVariableScope();
  constructor(private typeCheckingType: TypeCheckingClassType) {
    this.name = typeCheckingType.name;
    this.node = typeCheckingType.node;
    this.declaration = typeCheckingType.declaration;
    for (const methodDeclaration of this.declaration.declarationBlock.declarations) {
      if (!(methodDeclaration instanceof MethodDeclaration)) {
        continue;
      }
      this.methodDeclarationMap.set(methodDeclaration.name.content, methodDeclaration);
    }
  }
  public typeReferences(): Set<IType> {
    const typeReferences: Set<IType> = new Set();
    const declarationBlock = this.declaration.declarationBlock;
    const declarations = declarationBlock.declarations;
    for (const declaration of declarations) {
      if (!(declaration instanceof VariableFieldDeclaration) && !(declaration instanceof ConstantFieldDeclaration)) {
        continue;
      }
      const childType = declaration.typeHint.type;
      if (childType === undefined) {
        continue;
      }
      throw new Error();
      // typeReferences.add(childType.compilationType(this.genericVariableScope));
    }
    return typeReferences;
  }
  public memoryReferences(): Set<IType> {
    const memoryReferences: Set<IType> = new Set();
    const declarationBlock = this.declaration.declarationBlock;
    const declarations = declarationBlock.declarations;
    for (const declaration of declarations) {
      if (!(declaration instanceof VariableFieldDeclaration) && !(declaration instanceof ConstantFieldDeclaration)) {
        continue;
      }
      const childType = declaration.typeHint.type;
      if (childType === undefined) {
        continue;
      }
      throw new Error();
      // memoryReferences.add(childType.compilationType(this.genericVariableScope));
    }
    return memoryReferences;
  }
  public memoryMap(): MemoryLocation[] {
    return this.memoryMapData;
  }
  public memorySize(): number {
    return this.sizeData;
  }
  public typeOfConstructor(): FunctionType | undefined {
    this.populatePropertyMapping();
    if (this.constructorDeclaration === undefined) {
      const proeprtyTypes: IType[] = [];
      for (const proeprtyName of this.properties) {
        const type = this.propertyTypeMap.get(proeprtyName);
        if (type === undefined) {
          throw new Error();
        }
        proeprtyTypes.push(type);
      }
      throw new Error();
      // const functionType = new FunctionType;
      // (this.node.rootTypeTreeNode, proeprtyTypes, this, undefined);
      // return functionType;
    }
    return undefined;
  }
  public populatePropertyMapping() {
    if (this.propertyMappingPopulated) {
      return;
    }
    const declarationBlock = this.declaration.declarationBlock;
    for (const declaration of declarationBlock.declarations) {
      if (!(declaration instanceof VariableFieldDeclaration) && !(declaration instanceof ConstantFieldDeclaration)) {
        continue;
      }
      const name = declaration.nameToken.content;
      const type = declaration.typeHint.type;
      if (type === undefined) {
        continue;
      }
      this.properties.push(name);
      throw new Error();
      // this.propertyTypeMap.set(name, type.compilationType(this.genericVariableScope));
    }
    this.propertyMappingPopulated = true;
  }
  public resolveLayout() {
    this.properties = [];
    for (const declaration of this.declaration.declarationBlock.declarations) {
      if (declaration instanceof ConstantFieldDeclaration || declaration instanceof VariableFieldDeclaration) {
        const type = declaration.typeHint.type;
        if (type === undefined) {
          throw new Error();
        }
        const propertyName = declaration.nameToken.content;
        this.properties.push(propertyName);
        throw new Error();
        // this.propertyTypeMap.set(propertyName, type.compilationType(this.genericVariableScope));
      }
    }
    this.instanceMemoryMapData = new Map();
    let offset = 0;
    for (const property of this.properties) {
      const propertyType = this.typeOfMember(property);
      if (propertyType === undefined) {
        throw new Error();
      }
      const size = propertyType.memorySize();
      const map = propertyType.memoryMap();
      for (const entry of map) {
        this.instanceMemoryMapData.set(property, new MemoryLocation(offset + entry.baseOffset, entry.memoryType));
      }
      offset += size;
    }
    this.instanceSizeData = offset;
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
    this.populatePropertyMapping();
    const property = this.propertyTypeMap.get(str);
    if (property !== undefined) {
      return property;
    }
    const methodDeclaration = this.methodDeclarationMap.get(str);
    if (methodDeclaration !== undefined) {
      const type = methodDeclaration.getFunctionType;
      throw new Error();
      /*(this.typeCheckingType).compilationType(this.genericVariableScope);
      return type;*/
    }
    return undefined;
  }
  public hasMemberCalled(str: string): boolean {
    return this.typeOfMember(str) !== undefined;
  }
  public typeOfOperator(_str: string, _arity: number): IType | undefined {
    throw new Error("Method not implemented.");
  }
  public hasOperatorCalled(_str: string, _arity: number): boolean {
    throw new Error("Method not implemented.");
  }
  public equals(other: IType): boolean {
    if (!(other instanceof ClassType)) {
      return false;
    }
    return other.declaration === this.declaration;
  }

}
