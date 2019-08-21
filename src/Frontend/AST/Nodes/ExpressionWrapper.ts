import { OperatorScope } from "../../Expression Parsing/OperatorScopeBuilder";
import { Token } from "../../Lexer/Token";
import { TypeScope } from "../../Type Scope/TypeScopeBuilder";
import { AssignmentStatement } from "./AssignmentStatement";
import { Expression } from "./Expression";
import { Statement } from "./Statement";
export class ExpressionWrapper extends Statement {
  public parsed: boolean = false;
  public tokens: Token[];
  public expression: Expression | AssignmentStatement | undefined = undefined;

  public typeScope: TypeScope = new TypeScope();
  public operatorScope: OperatorScope = new OperatorScope();
  public raw: string;

  public allowAssignmentStatement: boolean;
  constructor(tokens: Token[], allowAssignmentStatement: boolean = false) {
    super();
    this.tokens = tokens;
    this.children = tokens;
    this.allowAssignmentStatement = allowAssignmentStatement;
    const start = tokens[0].range.start.offset;
    const end = tokens[tokens.length - 1].range.end.offset;
    const source = tokens[0].range.sourceContent;
    this.raw = source.substring(start, end);
  }
  public setExpression(expression: Expression | AssignmentStatement) {
    this.children = [expression];
    this.expression = expression;
  }
}
