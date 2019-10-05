import chalk from "chalk";
import { TypeExpressionWrapper } from "../../Type/UnresolvedType/TypeExpressionWrapper";
import { IAttribute } from "../ASTNode";
import { ITypeCheckingType } from "../ExpressionType";
export class TypeAttribute implements IAttribute {
  public kind: "type" = "type";
  public wrapper: TypeExpressionWrapper | ITypeCheckingType;
  constructor(wrapper: TypeExpressionWrapper | ITypeCheckingType) {
    this.wrapper = wrapper;
  }
  public toString(): string {
    const wrapper = this.wrapper;
    if (wrapper instanceof TypeExpressionWrapper) {
      const type = wrapper.type;
      if (type !== undefined) {
        return chalk.magenta(type.name);
      } else {
        return chalk.magenta("<unresolved type>");
      }
    } else {
      return chalk.magentaBright(wrapper.name);
    }
  }
}
