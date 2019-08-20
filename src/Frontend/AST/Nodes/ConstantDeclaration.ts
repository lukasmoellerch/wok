import { Token } from "../../Lexer/Token";
import { TypeExpression } from "../../Type/UnresolvedType/TypeExpression";
import { ExpressionWrapper } from "./ExpressionWrapper";
import { Statement } from "./Statement";

export class ConstantDeclaration extends Statement {
  public constantKeyword: Token;
  public identifierToken: Token;
  public colonToken: Token | undefined;
  public typeHint: TypeExpression | undefined;
  public assignmentOperator: Token;
  public value: ExpressionWrapper;
  constructor(constantKeyword: Token, identifierToken: Token, colonToken: Token | undefined, typeHint: TypeExpression | undefined, assignmentOperator: Token, value: ExpressionWrapper) {
    super();
    this.constantKeyword = constantKeyword;
    this.identifierToken = identifierToken;
    this.colonToken = colonToken;
    this.typeHint = typeHint;
    this.assignmentOperator = assignmentOperator;
    this.value = value;
    if (colonToken !== undefined && typeHint !== undefined) {
      this.children = [constantKeyword, identifierToken, colonToken, typeHint, assignmentOperator, value];
    } else {
      this.children = [constantKeyword, identifierToken, assignmentOperator, value];
    }
  }
}
