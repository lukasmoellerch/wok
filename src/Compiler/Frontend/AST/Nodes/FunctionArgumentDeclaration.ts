import { Token } from "../../Lexer/Token";
import { TypeExpression } from "../../Type/UnresolvedType/TypeExpression";
import { TypeExpressionWrapper } from "../../Type/UnresolvedType/TypeExpressionWrapper";
import { VariableScopeEntry } from "../../VariableScope/VariableScope";
import { ASTNode } from "../ASTNode";
import { TypeAttribute } from "../Attributes/TypeAttribute";
export class FunctionArgumentDeclaration extends ASTNode {
  public name: Token;
  public type: TypeExpressionWrapper;
  public entry: VariableScopeEntry | undefined;
  constructor(name: Token, type: TypeExpression) {
    super();
    this.name = name;
    this.type = new TypeExpressionWrapper(type);
    this.children = [name];
    this.setAttribute(new TypeAttribute(this.type));
  }
}