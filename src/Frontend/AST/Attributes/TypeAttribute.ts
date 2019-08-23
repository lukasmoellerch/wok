import chalk from "chalk";
import { TypeExpressionWrapper } from "../../Type/UnresolvedType/TypeExpressionWrapper";
import { IAttribute } from "../ASTNode";
export class TypeAttribute implements IAttribute {
  public kind: "type" = "type";
  public wrapper: TypeExpressionWrapper;
  constructor(wrapper: TypeExpressionWrapper) {
    this.wrapper = wrapper;
  }
  public toString(): string {
    return chalk.magenta(this.wrapper.type.name);
  }

}
