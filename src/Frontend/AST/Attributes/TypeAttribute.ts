import chalk from "chalk";
import { TypeExpression } from "../../Type/UnresolvedType/TypeExpression";
import { IAttribute } from "../ASTNode";
export class TypeAttribute implements IAttribute {
  public kind: "type" = "type";
  public unresolvedType: TypeExpression;
  constructor(unresolvedType: TypeExpression) {
    this.unresolvedType = unresolvedType;
  }
  public toString(): string {
    return chalk.magenta(this.unresolvedType.stringifyType());
  }

}
