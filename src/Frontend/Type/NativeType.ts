import { TypeScope } from "../Type Scope/TypeScope";
import { FunctionType } from "./FunctionType";
import { IType } from "./Type";

export class NativeIntegerType implements IType {
  public name: string;
  public scope: TypeScope;
  public irVariablesNeededForRepresentation: number = 1;
  public signed: boolean;
  public bytes: number;
  public binaryOperatorType: FunctionType;
  public unaryOperatorType: FunctionType;
  constructor(signed: boolean, bytes: number) {
    this.signed = signed;
    this.bytes = bytes;
    this.scope = new TypeScope();
    const prefix = signed ? "s" : "u";
    const width = bytes * 8 + "";
    this.name = prefix + width;

    this.binaryOperatorType = new FunctionType([this], this, this);
    this.unaryOperatorType = new FunctionType([], this, this);
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
        return this.unaryOperatorType;
      }
    } else if (arity === 1) {
      if (str === "+") {
        return this.binaryOperatorType;
      }
      if (str === "-") {
        return this.binaryOperatorType;
      }
      if (str === "*") {
        return this.binaryOperatorType;
      }
      if (str === "/") {
        return this.binaryOperatorType;
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
