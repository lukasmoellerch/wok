import { IType } from "../../Type/Type";
import { ASTNode } from "../ASTNode";
import { TypeAttribute } from "../Attributes/TypeAttribute";
import { ImplictConversionExpression } from "./ImplictConversionExpression";
export class Expression extends ASTNode {
  public type: IType | undefined;
  public implictConversionTargetType: IType | undefined;
  public setType(type: IType) {
    this.type = type;
    this.setAttribute(new TypeAttribute(type));
  }
  public addImplictConversionsToChildren() {
    return;
  }
  public addImplictConversionIfNeeded(): Expression {
    const type = this.forceType();
    const t = this.implictConversionTargetType;
    if (t !== undefined) {
      return new ImplictConversionExpression(type, t, this);
    } else {
      return this;
    }
  }
  public forceType(): IType {
    return this.type as IType;
  }
}
