import { Token } from "../../Lexer/Token";
import { TypeExpression } from "../../Type/UnresolvedType/TypeExpression";
import { TypeExpressionWrapper } from "../../Type/UnresolvedType/TypeExpressionWrapper";
import { VariableScopeEntry } from "../../VariableScope/VariableScope";
import { ASTNode } from "../ASTNode";
import { TypeAttribute } from "../Attributes/TypeAttribute";
export class FunctionArgumentDeclaration extends ASTNode {
  public name = "FunctionArgumentDeclaration";
  public nameToken: Token;
  public type: TypeExpressionWrapper;
  public entry: VariableScopeEntry | undefined;
  constructor(nameToken: Token, type: TypeExpression) {
    super();
    this.nameToken = nameToken;
    this.type = new TypeExpressionWrapper(type);
    this.children = [nameToken];
    this.setAttribute(new TypeAttribute(this.type));
  }
}
