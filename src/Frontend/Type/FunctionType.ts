import { FunctionType as IRFunctionType, Type } from "../../IR/AST";
import { TypeTreeNode } from "../Type Scope/TypeScope";
import { IType } from "./Type";

export class FunctionType implements IType {
  public name: string = "FunctionType";
  public node: TypeTreeNode;
  constructor(node: TypeTreeNode, public args: IType[], public result: IType, public thisType?: IType) {
    this.node = node;
  }
  public irVariableTypes(): Type[] {
    return [];
  }
  public irVariablesNeededForRepresentation(): number {
    return 0;
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
  public get irFunctionType(): IRFunctionType {
    const argTypeArray: Type[] = [];
    for (const argType of this.args) {
      const irTypes = argType.irVariableTypes();
      argTypeArray.push(...irTypes);
    }
    const resultTypeArray: Type[] = this.result.irVariableTypes();
    return [argTypeArray, resultTypeArray];

  }

}
