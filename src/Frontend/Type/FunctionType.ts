import { TypeScope } from "../Type Scope/TypeScopeBuilder";
import { IType } from "./Type";

export class FunctionType implements IType {
  public name: string = "FunctionType";
  public scope: TypeScope = new TypeScope();
  public irVariablesNeededForRepresentation: number = 1;
  constructor(public args: IType[], public result: IType, public thisType?: IType) { }
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
