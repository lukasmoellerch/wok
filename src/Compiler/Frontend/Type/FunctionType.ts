import { FunctionType as IRFunctionType, MemoryIRType, Type } from "../../IR/AST";
import { GenericTypeVariableScope, ITypeCheckingType } from "../AST/ExpressionType";
import { GenericTypeIdentifier, IGenericTypeTemplate, SpecializedTypeReference, TypeProvider } from "../Type Scope/TypeProvider";
import { TypeTreeNode } from "../Type Scope/TypeScope";
import { IType, MemoryLocation } from "./Type";

class FunctionTypeTemplate implements IGenericTypeTemplate {
  public argsNeeded: number = 1;
  constructor(public identifier: GenericTypeIdentifier) {

  }
  public createWithoutArguments(): IType {
    throw new Error("Method not implemented.");
  }
  public createWithArguments(provider: TypeProvider, _thisRef: SpecializedTypeReference, args: SpecializedTypeReference[]): IType {
    const thisType = args[0];
    const returnType = args[1];
    const argTypes = args.slice(2);
    const ret = provider.get(returnType);
    const q = thisType.index === -1 ? undefined : provider.get(thisType);
    return new FunctionType(provider, argTypes.map((argType) => provider.get(argType)), ret, q);
  }
}
export const functionIdentifier = new GenericTypeIdentifier("Function");
export const functionTemplate = new FunctionTypeTemplate(functionIdentifier);

export class TypeCheckingFunctionType implements ITypeCheckingType {
  public name: string = "TypeCheckingFunctionType";
  constructor(
    public node: TypeTreeNode,
    public args: ITypeCheckingType[],
    public result: ITypeCheckingType,
    public thisType?: ITypeCheckingType) {
  }
  public compilationType(provider: TypeProvider, scope: GenericTypeVariableScope): SpecializedTypeReference {
    const thisType = this.thisType;
    const res = this.result.compilationType(provider, scope);
    const templateArgs = [thisType ? thisType.compilationType(provider, scope) : provider.voidIdentifier, res, ...this.args.map((arg) => arg.compilationType(provider, scope))];
    provider.ensureGeneric(functionTemplate);
    return provider.specializeGeneric(functionIdentifier, templateArgs);
  }
  public equals(other: ITypeCheckingType): boolean {
    if (other instanceof TypeCheckingFunctionType) {
      if (this.args.length !== other.args.length) {
        return false;
      }
      if (!this.result.equals(other.result)) {
        return false;
      }
      for (let i = this.args.length - 1; i >= 0; i--) {
        if (!this.args[i].equals(other.args[i])) {
          return false;
        }
      }
      return true;
    }
    return false;
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
}

export class FunctionType implements IType {
  public get irFunctionType(): IRFunctionType {
    const argTypeArray: Type[] = [];
    const thisType = this.thisType;
    if (thisType !== undefined) {
      const irTypes = thisType.irVariableTypes();
      argTypeArray.push(...irTypes);
    }
    for (const argType of this.args) {
      const irTypes = argType.irVariableTypes();
      argTypeArray.push(...irTypes);
    }
    const resultTypeArray: Type[] = this.result.irVariableTypes();
    return [argTypeArray, resultTypeArray];

  }
  public name: string = "FunctionType";
  private memoryMapData: MemoryLocation[] = [new MemoryLocation(0, MemoryIRType.funcptr)];
  constructor(public provider: TypeProvider, public args: IType[], public result: IType, public thisType?: IType) {
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
    return undefined;
  }
  public irVariableTypes(): Type[] {
    return [Type.funcptr];
  }
  public irVariablesNeededForRepresentation(): number {
    return 1;
  }
  public toString(): string {
    throw new Error("Method not implemented.");
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
