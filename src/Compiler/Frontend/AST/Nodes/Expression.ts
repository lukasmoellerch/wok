import { ASTNode } from "../ASTNode";
import { TypeAttribute } from "../Attributes/TypeAttribute";
import { ITypeCheckingType } from "../ExpressionType";
import { ImplictConversionExpression } from "./ImplictConversionExpression";
export class Expression extends ASTNode {
  public type: ITypeCheckingType | undefined;
  public implictConversionTargetType: ITypeCheckingType | undefined;
  public setType(type: ITypeCheckingType) {
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
  public forceType(): ITypeCheckingType {
    return this.type as ITypeCheckingType;
  }
}
