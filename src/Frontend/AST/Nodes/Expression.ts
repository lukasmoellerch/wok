import { IType } from "../../Type/Type";
import { VoidType } from "../../Type/VoidType";
import { ASTNode } from "../ASTNode";
import { TypeAttribute } from "../Attributes/TypeAttribute";
import { ImplictConversionExpression } from "./ImplictConversionExpression";
export class Expression extends ASTNode {
  public type: IType = new VoidType();
  public implictConversionTargetType: IType | undefined;
  public setType(type: IType) {
    this.type = type;
    this.setAttribute(new TypeAttribute(type));
  }
  public addImplictConversionsToChildren() {
    return;
  }
  public addImplictConversionIfNeeded(): Expression {
    const t = this.implictConversionTargetType;
    if (t !== undefined) {
      return new ImplictConversionExpression(this.type, t, this);
    } else {
      return this;
    }
  }
}
