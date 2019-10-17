import { OperatorScope } from "../../Expression Parsing/OperatorScope";
import { Token } from "../../Lexer/Token";
import { TypeTreeNode } from "../../Type Scope/TypeScope";
import { AssignmentStatement } from "./AssignmentStatement";
import { Expression } from "./Expression";
import { ImplictConversionExpression } from "./ImplictConversionExpression";
import { Statement } from "./Statement";
export class ExpressionWrapper extends Statement {
  public name = "ExpressionWrapper";
  public parsed: boolean = false;
  public tokens: Token[];
  public expression: Expression | AssignmentStatement | undefined = undefined;

  public wrappingTypeTreeNode: TypeTreeNode | undefined;
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
  public addImplictConversionsToChildren() {
    const expression = this.expression;
    if (expression instanceof Expression) {
      const implictConversionTargetType = expression.implictConversionTargetType;
      if (implictConversionTargetType !== undefined) {
        this.expression = new ImplictConversionExpression(expression.forceType(), implictConversionTargetType, expression);
      }
    }
  }
}
