import { Type } from "../../IR/AST";
import { GenericTypeVariableScope, ITypeCheckingType, TypeVariable } from "../AST/ExpressionType";
import { ConstantFieldDeclaration } from "../AST/Nodes/ConstantFieldDeclaration";
import { InitDeclaration } from "../AST/Nodes/InitDeclaration";
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
  ) {

  }
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
  public initDeclaration: InitDeclaration | undefined;
  public operatorMap: Map<string, ITypeCheckingType> = new Map();
  public propertyTypeExpressions: TypeExpressionWrapper[] = [];
  private rawTypeCheckingType: TypeCheckingStructType;
  constructor(node: TypeTreeNode, declaration: StructDeclaration, private genericAssignment: Map<string, ITypeCheckingType>, rawTypeCheckingType?: TypeCheckingStructType) {
    this.rawTypeCheckingType = rawTypeCheckingType === undefined ? this : rawTypeCheckingType;
    this.name = declaration.nameToken.content + "<" + [...genericAssignment.entries()].map(([a, b]) => `${a}: ${b.name}`).join(", ") + ">";
    this.node = node;
    this.declaration = declaration;
    for (const decl of declaration.declarationBlock.declarations) {
      if (decl instanceof MethodDeclaration) {
        this.memberMap.set(decl.nameToken.content, decl);
      }
      if (decl instanceof VariableFieldDeclaration) {
        this.memberMap.set(decl.nameToken.content, decl);
        this.propertyTypeExpressions.push(decl.typeHint);
      }
      if (decl instanceof ConstantFieldDeclaration) {
        this.memberMap.set(decl.nameToken.content, decl);
        this.propertyTypeExpressions.push(decl.typeHint);
      }
      if (decl instanceof InitDeclaration) {
        this.initDeclaration = decl;
      }
    }
  }
  public applyMapping(other: Map<string, ITypeCheckingType>): ITypeCheckingType {
    const map: Map<string, ITypeCheckingType> = new Map();
    for (const [a, b] of this.genericAssignment.entries()) {
      map.set(a, b.applyMapping(other));
    }

    return new TypeCheckingStructType(this.node, this.declaration, map, this.rawTypeCheckingType);
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
    const decl = this.initDeclaration;
    if (decl !== undefined) {
      return decl.getFunctionType(this.node, this).applyMapping(this.genericAssignment);
    }
    return new TypeCheckingFunctionType(this.node, this.propertyTypeExpressions.map((a) => this.resolveGeneric(a.type as ITypeCheckingType)), this);
  }
  public typeOfMember(str: string): ITypeCheckingType | undefined {
    const declaration = this.memberMap.get(str);
    if (declaration === undefined) {
      return undefined;
    }
    if (declaration instanceof MethodDeclaration) {
      return declaration.getFunctionType(this.node, this).applyMapping(this.genericAssignment);
    } else {
      return this.resolveGeneric(declaration.typeHint.type as ITypeCheckingType);
    }
  }
  public typeOfOperator(_str: string): ITypeCheckingType | undefined {
    throw new Error("Method not implemented.");
  }
  public compilationType(provider: TypeProvider, scope: GenericTypeVariableScope): SpecializedTypeReference {
    const map: Map<string, SpecializedTypeReference> = new Map();
    for (const [a, b] of scope.map.entries()) {
      map.set(a, b);
    }
    for (const [a, b] of this.genericAssignment.entries()) {
      try {
        map.set(a, b.compilationType(provider, scope));
      } catch (e) {
        //
      }
    }
    const tct = this.declaration.typeCheckingType;
    if (tct === undefined) {
      throw new Error();
    }
    const name = tct.node.toString();
    const identifier = TypeCheckingStructType.declarationIdentifierMap.get(name) || new GenericTypeIdentifier(name);
    TypeCheckingStructType.declarationIdentifierMap.set(name, identifier);

    provider.ensureGeneric(new StructGenericTypeTemplate(this.rawTypeCheckingType, identifier, this.declaration.genericVariables.length, this.declaration.genericVariables.map((token) => token.content), this.declaration));

    return provider.specializeGeneric(identifier, this.declaration.genericVariables.map((token) => map.get(token.content) as SpecializedTypeReference));
  }
  private resolveGeneric(t: ITypeCheckingType): ITypeCheckingType {
    return t.applyMapping(this.genericAssignment);
  }

}
export class StructType implements IType {
  public name: string;
  public constructorDeclaration: undefined | InitDeclaration;
  public methodDeclarationMap: Map<string, MethodDeclaration> = new Map();

  public properties: SpecializedTypeReference[] = [];
  public propertyNames: string[] = [];
  public propertyTypeMap: Map<string, SpecializedTypeReference> = new Map();
  public propertyIrVariableIndexMapping: Map<string, number[]> = new Map();

  public genericVariableScope: GenericTypeVariableScope = new GenericTypeVariableScope();

  private constructorType: SpecializedTypeReference;
  private memberTypeMap: Map<string, SpecializedTypeReference> = new Map();
  private irVariableTypesCache: Type[] = [];

  private memoryMapData: MemoryLocation[] = [];
  private sizeData: number = NaN;
  constructor(private provider: TypeProvider, public declaration: StructDeclaration, names: string[], args: SpecializedTypeReference[], public typeCheckingType: TypeCheckingStructType, thisRef: SpecializedTypeReference) {
    this.name = declaration.nameToken.content + "<" + args.map((a) => a.index.toString()).join(", ") + ">";

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
        const t = typeCheckingType.typeOfMember(decl.nameToken.content);
        if (t === undefined) {
          throw new Error();
        }
        this.methodDeclarationMap.set(decl.nameToken.content, decl);
        this.memberTypeMap.set(decl.nameToken.content, t.compilationType(provider, this.genericVariableScope));
      } else if (decl instanceof InitDeclaration) {
        this.constructorDeclaration = decl;
      }
    }
    const initDecl = this.constructorDeclaration;
    if (initDecl === undefined) {
      this.constructorType = provider.specialize(functionTemplate, [provider.voidIdentifier, thisRef, ...this.properties]);
    } else {
      const t = typeCheckingType.typeOfConstructor();
      if (t === undefined) {
        throw new Error();
      }
      this.constructorType = t.compilationType(provider, this.genericVariableScope);
    }
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
    return this.name;
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
