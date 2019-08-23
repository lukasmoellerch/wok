import { TypeScope } from "../Type Scope/TypeScope";
import { IType } from "./Type";

export class VoidType implements IType {
  public name: string = "void";
  public scope = new TypeScope();
  public irVariablesNeededForRepresentation: number = 0;
  public equals(other: IType): boolean {
    return other instanceof VoidType;
  }
  public toString(): string {
    throw new Error("Method not implemented.");
  }
  public typeOfMember(_str: string): IType | undefined {
    throw new Error("Method not implemented.");
  }
  public hasMemberCalled(_str: string): boolean {
    throw new Error("Method not implemented.");
  }
  public typeOfOperator(_str: string, _arity: number): IType | undefined {
    throw new Error("Method not implemented.");
  }
  public hasOperatorCalled(_str: string, _arity: number): boolean {
    throw new Error("Method not implemented.");
  }

}
