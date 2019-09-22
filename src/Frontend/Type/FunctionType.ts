import { FunctionType as IRFunctionType, MemoryIRType, Type } from "../../IR/AST";
import { TypeTreeNode } from "../Type Scope/TypeScope";
import { IType, MemoryLocation } from "./Type";

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
  public node: TypeTreeNode;
  private memoryMapData: MemoryLocation[] = [new MemoryLocation(0, MemoryIRType.funcptr)];
  constructor(node: TypeTreeNode, public args: IType[], public result: IType, public thisType?: IType) {
    this.node = node;
  }
  typeReferences(): Set<IType> {
    return new Set();
  }
  memoryReferences(): Set<IType> {
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
  public equals(other: IType): boolean {
    if (other instanceof FunctionType) {
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
