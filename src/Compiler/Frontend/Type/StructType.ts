import { Type } from "../../IR/AST";
import { GenericTypeVariableScope, ITypeCheckingType, TypeVariable } from "../AST/ExpressionType";
import { ConstantFieldDeclaration } from "../AST/Nodes/ConstantFieldDeclaration";
import { MethodDeclaration } from "../AST/Nodes/MethodDeclaration";
import { StructDeclaration } from "../AST/Nodes/StructDeclaration";
import { VariableFieldDeclaration } from "../AST/Nodes/VariableFieldDeclaration";
import { GenericTypeIdentifier, IGenericTypeTemplate, SpecializedTypeReference, TypeProvider } from "../Type Scope/TypeProvider";
import { TypeTreeNode } from "../Type Scope/TypeScope";
import { functionTemplate, FunctionType, TypeCheckingFunctionType } from "./FunctionType";
import { IType, MemoryLocation } from "./Type";
import { TypeExpressionWrapper } from "./UnresolvedType/TypeExpressionWrapper";
class StructGenericTypeTemplate implements IGenericTypeTemplate {
  constructor(
    private typeCheckingType: TypeCheckingStructType,
    public identifier: GenericTypeIdentifier,
    public argsNeeded: number,
    private argNames: string[],
    private declaration: StructDeclaration,
  ) { }
  public createWithArguments(provider: TypeProvider, thisRef: SpecializedTypeReference, args: SpecializedTypeReference[]): IType {
    return new StructType(provider, this.declaration, this.argNames, args, this.typeCheckingType, thisRef);
  }

}
export class TypeCheckingStructType implements ITypeCheckingType {
  private static declarationIdentifierMap: Map<string, GenericTypeIdentifier> = new Map();
  public declaration: StructDeclaration;
  public node: TypeTreeNode;
  public name: string;
  public memberMap: Map<string, MethodDeclaration | VariableFieldDeclaration | ConstantFieldDeclaration> = new Map();
  public operatorMap: Map<string, ITypeCheckingType> = new Map();
  public propertyTypeExpressions: TypeExpressionWrapper[] = [];
  private genericAssignment: Map<string, ITypeCheckingType> = new Map();
  constructor(name: string, node: TypeTreeNode, declaration: StructDeclaration) {
    this.name = name;
    this.node = node;
    this.declaration = declaration;
    for (let i = 0; i < this.node.args.length; i++) {
      this.genericAssignment.set(declaration.genericVariables[i].content, this.node.args[i].typeCheckingType as ITypeCheckingType);
    }
    for (const decl of declaration.declarationBlock.declarations) {
      if (decl instanceof MethodDeclaration) {
        this.memberMap.set(decl.name.content, decl);
      }
      if (decl instanceof VariableFieldDeclaration) {
        this.memberMap.set(decl.nameToken.content, decl);
        this.propertyTypeExpressions.push(decl.typeHint);
      }
      if (decl instanceof ConstantFieldDeclaration) {
        this.memberMap.set(decl.nameToken.content, decl);
        this.propertyTypeExpressions.push(decl.typeHint);
      }

    }
  }
  public equals(other: ITypeCheckingType): boolean {
    if (!(other instanceof TypeCheckingStructType)) {
      return false;
    }
    if (this.declaration !== other.declaration) {
      return false;
    }
    for (const [name, thisValue] of this.genericAssignment.entries()) {
      const otherValue = other.genericAssignment.get(name);
      if (otherValue === undefined) {
        return false;
      }
      if (!otherValue.equals(thisValue)) {
        return false;
      }
    }
    return true;
  }
  public typeOfConstructor(): TypeCheckingFunctionType | undefined {
    return new TypeCheckingFunctionType(this.node, this.propertyTypeExpressions.map((a) => this.resolveGeneric(a.type as ITypeCheckingType)), this);
  }
  public typeOfMember(str: string): ITypeCheckingType | undefined {
    const declaration = this.memberMap.get(str);
    if (declaration === undefined) {
      return undefined;
    }
    if (declaration instanceof MethodDeclaration) {
      return declaration.getFunctionType(this.node, this);
    } else {
      return this.resolveGeneric(declaration.typeHint.type as ITypeCheckingType);
    }
  }
  public typeOfOperator(_str: string): ITypeCheckingType | undefined {
    throw new Error("Method not implemented.");
  }
  public compilationType(provider: TypeProvider, scope: GenericTypeVariableScope): SpecializedTypeReference {
    const tct = this.declaration.typeCheckingType;
    if (tct === undefined) {
      throw new Error();
    }
    const name = tct.node.toString();
    const identifier = TypeCheckingStructType.declarationIdentifierMap.get(name) || new GenericTypeIdentifier(name);
    TypeCheckingStructType.declarationIdentifierMap.set(name, identifier);

    provider.ensureGeneric(new StructGenericTypeTemplate(this, identifier, this.declaration.genericVariables.length, this.declaration.genericVariables.map((token) => token.content), this.declaration));

    return provider.specializeGeneric(identifier, this.declaration.genericVariables.map((token) => this.genericAssignment.get(token.content) as ITypeCheckingType).map((a) => a.compilationType(provider, scope)));
  }
  private resolveGeneric(t: ITypeCheckingType): ITypeCheckingType {
    if (t instanceof TypeVariable) {
      const res = this.genericAssignment.get(t.name);
      if (res === undefined) {
        return t;
      }
      return res;
    }
    return t;
  }
}
export class StructType implements IType {
  public name: string;
  public constructorDeclaration: undefined;
  public methodDeclarationMap: Map<string, MethodDeclaration> = new Map();

  public properties: SpecializedTypeReference[] = [];
  public propertyNames: string[] = [];
  public propertyTypeMap: Map<string, SpecializedTypeReference> = new Map();
  public propertyIrVariableIndexMapping: Map<string, number[]> = new Map();

  private constructorType: SpecializedTypeReference;
  private memberTypeMap: Map<string, SpecializedTypeReference> = new Map();
  private irVariableTypesCache: Type[] = [];

  private memoryMapData: MemoryLocation[] = [];
  private sizeData: number = NaN;

  private genericVariableScope: GenericTypeVariableScope = new GenericTypeVariableScope();
  constructor(private provider: TypeProvider, public declaration: StructDeclaration, names: string[], args: SpecializedTypeReference[], typeCheckingType: TypeCheckingStructType, thisRef: SpecializedTypeReference) {
    this.name = declaration.nameToken.content;

    for (let i = 0; i < names.length; i++) {
      this.genericVariableScope.map.set(names[i], args[i]);
    }
    for (const decl of declaration.declarationBlock.declarations) {
      if (decl instanceof ConstantFieldDeclaration) {
        const t = decl.typeHint.type;
        if (t === undefined) {
          throw new Error();
        }
        const type = this.resolveGeneric(t);
        this.propertyTypeMap.set(decl.nameToken.content, type);
        this.memberTypeMap.set(decl.nameToken.content, type);
        this.properties.push(type);
        this.propertyNames.push(decl.nameToken.content);
      } else if (decl instanceof VariableFieldDeclaration) {
        const t = decl.typeHint.type;
        if (t === undefined) {
          throw new Error();
        }
        const type = this.resolveGeneric(t);
        this.propertyTypeMap.set(decl.nameToken.content, type);
        this.memberTypeMap.set(decl.nameToken.content, type);
        this.properties.push(type);
        this.propertyNames.push(decl.nameToken.content);
      } else if (decl instanceof MethodDeclaration) {
        const t = typeCheckingType.typeOfMember(decl.name.content);
        if (t === undefined) {
          throw new Error();
        }
        this.methodDeclarationMap.set(decl.name.content, decl);
        this.memberTypeMap.set(decl.name.content, t.compilationType(provider, this.genericVariableScope));
      }
    }
    this.constructorType = provider.specialize(functionTemplate, [provider.voidIdentifier, thisRef]);
  }
  public typeReferences(): Set<IType> {
    const typeReferences: Set<IType> = new Set();
    for (const property of this.properties) {
      typeReferences.add(this.provider.get(property));
    }
    return typeReferences;
  }
  public memoryReferences(): Set<IType> {
    const typeReferences: Set<IType> = new Set();
    for (const property of this.properties) {
      typeReferences.add(this.provider.get(property));
    }
    return typeReferences;
  }
  public memoryMap(): MemoryLocation[] {
    return this.memoryMapData;
  }
  public memorySize(): number {
    return this.sizeData;
  }
  public typeOfConstructor(): FunctionType | undefined {
    return this.provider.get(this.constructorType) as FunctionType;
  }
  public resolveLayout() {
    for (const [propertyName, propertyType] of this.propertyTypeMap.entries()) {
      const type = this.provider.get(propertyType);
      const propertyIrVariableTypes = type.irVariableTypes();
      const irVariableIndexArray: number[] = [];
      for (const irTypes of propertyIrVariableTypes) {
        irVariableIndexArray.push(this.irVariableTypesCache.length);
        this.irVariableTypesCache.push(irTypes);
      }
      this.propertyIrVariableIndexMapping.set(propertyName, irVariableIndexArray);
    }

    let offset = 0;
    this.memoryMapData = [];
    for (const [, propertyType] of this.propertyTypeMap.entries()) {
      const type = this.provider.get(propertyType);
      const size = type.memorySize();
      const map = type.memoryMap();
      for (const entry of map) {
        this.memoryMapData.push(new MemoryLocation(offset + entry.baseOffset, entry.memoryType));
      }
      offset += size;
    }
    this.sizeData = offset;
  }
  public irVariablesNeededForRepresentation(): number {
    return this.irVariableTypesCache.length;
  }
  public irVariableTypes(): Type[] {
    return this.irVariableTypesCache;
  }
  public toString(): string {
    return (this.declaration.typeCheckingType as ITypeCheckingType).node.toString();
  }
  public typeOfMember(str: string): IType | undefined {
    const ref = this.memberTypeMap.get(str);
    if (ref === undefined) {
      return undefined;
    }
    return this.provider.get(ref);
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
    if (!(other instanceof StructType)) {
      return false;
    }
    return other.declaration === this.declaration;
  }
  private resolveGeneric(t: ITypeCheckingType): SpecializedTypeReference {
    if (t instanceof TypeVariable) {
      const res = this.genericVariableScope.reolve(t.name);
      if (res === undefined) {
        throw new Error();
      }
      return res;
    }
    return t.compilationType(this.provider, this.genericVariableScope);
  }
}
