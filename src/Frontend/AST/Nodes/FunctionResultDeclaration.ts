import { TypeExpression } from "../../Type/UnresolvedType/TypeExpression";
import { TypeExpressionWrapper } from "../../Type/UnresolvedType/TypeExpressionWrapper";
import { ASTNode } from "../ASTNode";
import { TypeAttribute } from "../Attributes/TypeAttribute";

export class FunctionResultDeclaration extends ASTNode {
  public type: TypeExpressionWrapper;
  constructor(type: TypeExpression) {
    super();
    this.type = new TypeExpressionWrapper(type);
    this.children = [];
    this.setAttribute(new TypeAttribute(this.type));
  }

}
