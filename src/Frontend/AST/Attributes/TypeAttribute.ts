import chalk from "chalk";
import { IType } from "../../Type/Type";
import { TypeExpressionWrapper } from "../../Type/UnresolvedType/TypeExpressionWrapper";
import { IAttribute } from "../ASTNode";
export class TypeAttribute implements IAttribute {
  public kind: "type" = "type";
  public wrapper: TypeExpressionWrapper | IType;
  constructor(wrapper: TypeExpressionWrapper | IType) {
    this.wrapper = wrapper;
  }
  public toString(): string {
    const wrapper = this.wrapper;
    if (wrapper instanceof TypeExpressionWrapper) {
      return chalk.magenta(wrapper.type.name);
    } else {
      return chalk.magentaBright(wrapper.name);
    }
  }
}
