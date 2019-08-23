import { Token } from "../../Lexer/Token";
import { TypeExpression } from "../../Type/UnresolvedType/TypeExpression";
import { TypeExpressionWrapper } from "../../Type/UnresolvedType/TypeExpressionWrapper";
import { VariableScopeEntry } from "../../VariableScope/VariableScope";
import { ExpressionWrapper } from "./ExpressionWrapper";
import { Statement } from "./Statement";

export class VariableDeclaration extends Statement {
  public variableKeyword: Token;
  public identifierToken: Token;
  public colonToken: Token | undefined;
  public typeHint: TypeExpressionWrapper | undefined;
  public assignmentOperator: Token;
  public value: ExpressionWrapper;
  public entry: VariableScopeEntry | undefined;
  constructor(variableKeyword: Token, identifierToken: Token, colonToken: Token | undefined, typeHint: TypeExpression | undefined, assignmentOperator: Token, value: ExpressionWrapper) {
    super();
    this.variableKeyword = variableKeyword;
    this.identifierToken = identifierToken;
    this.colonToken = colonToken;
    if (typeHint !== undefined) {
      this.typeHint = new TypeExpressionWrapper(typeHint);
    }
    this.assignmentOperator = assignmentOperator;
    this.value = value;
    if (colonToken !== undefined && typeHint !== undefined) {
      this.children = [variableKeyword, identifierToken, colonToken, typeHint, assignmentOperator, value];
    } else {
      this.children = [variableKeyword, identifierToken, assignmentOperator, value];
    }
  }
}
