import { OperatorScope } from "../../Expression Parsing/OperatorScopeBuilder";
import { Token } from "../../Lexer/Token";
import { TypeScope } from "../../Type Scope/TypeScopeBuilder";
import { Expression } from "./Expression";
import { Statement } from "./Statement";
export class ExpressionWrapper extends Statement {
  public parsed: boolean = false;
  public tokens: Token[];
  public expression: Expression | undefined = undefined;

  public typeScope: TypeScope = new TypeScope();
  public operatorScope: OperatorScope = new OperatorScope();

  public allowAssignmentStatement: boolean;
  constructor(tokens: Token[], allowAssignmentStatement: boolean = false) {
    super();
    this.tokens = tokens;
    this.children = tokens;
    this.allowAssignmentStatement = allowAssignmentStatement;
  }
}
