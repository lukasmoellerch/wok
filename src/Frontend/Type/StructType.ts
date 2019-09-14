import { Type } from "../../IR/AST";
import { ConstantFieldDeclaration } from "../AST/Nodes/ConstantFieldDeclaration";
import { StructDeclaration } from "../AST/Nodes/StructDeclaration";
import { VariableFieldDeclaration } from "../AST/Nodes/VariableFieldDeclaration";
import { TypeTreeNode } from "../Type Scope/TypeScope";
import { IType } from "./Type";

export class StructType implements IType {
  public name: string;
  public node: TypeTreeNode;
  public declaration: StructDeclaration;
  public constructorDeclaration: undefined;
  public properties: string[] = [];
  public propertyTypeMap: Map<string, IType> = new Map();
  public propertyIrVariableIndexMapping: Map<string, number[]> = new Map();
  public irVariableTypesCache: Type[] = [];
  public propertyMappingPopulated = false;
  constructor(name: string, node: TypeTreeNode, declaration: StructDeclaration) {
    this.name = name;
    this.node = node;
    this.declaration = declaration;
  }
  public populatePropertyMapping() {
    if (this.propertyMappingPopulated) {
      return;
    }
    const declarationBlock = this.declaration.declarationBlock;
    for (const declaration of declarationBlock.declarations) {
      const name = declaration.nameToken.content;
      const type = declaration.typeHint.type;
      if (type === undefined) {
        continue;
      }
      this.properties.push(name);
      this.propertyTypeMap.set(name, type);
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
        const irVariableIndexArray: number[] = [];
        const propertyIrVariableTypes = type.irVariableTypes();
        for (const irTypes of propertyIrVariableTypes) {
          irVariableIndexArray.push(this.irVariableTypesCache.length);
          this.irVariableTypesCache.push(irTypes);
        }
        this.propertyIrVariableIndexMapping.set(propertyName, irVariableIndexArray);
        this.propertyTypeMap.set(propertyName, type);
      }
    }
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
    this.populatePropertyMapping();
    return this.propertyTypeMap.get(str);
  }
  public hasMemberCalled(str: string): boolean {
    this.populatePropertyMapping();
    return this.propertyTypeMap.has(str);
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

}
