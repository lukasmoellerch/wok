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
  constructor(tokens: Token[]) {
    super();
    this.tokens = tokens;
    this.children = tokens;
  }
}
