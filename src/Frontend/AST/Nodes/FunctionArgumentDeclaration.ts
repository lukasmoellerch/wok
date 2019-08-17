import { Token } from "../../Lexer/Token";
import { TypeExpression } from "../../Type/UnresolvedType/TypeExpression";
import { ASTNode } from "../ASTNode";
import { TypeAttribute } from "../Attributes/TypeAttribute";
export class FunctionArgumentDeclaration extends ASTNode {
  public name: Token;
  public type: TypeExpression;
  constructor(name: Token, type: TypeExpression) {
    super();
    this.name = name;
    this.type = type;
    this.children = [name, type];
    this.setAttribute(new TypeAttribute(type));
  }
}
