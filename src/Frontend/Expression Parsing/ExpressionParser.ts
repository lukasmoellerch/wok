import { ILValue } from "../AST/AST";
import { ASTWalker } from "../AST/ASTWalker";
import { AssignmentStatement } from "../AST/Nodes/AssignmentStatement";
import { BinaryOperatorExpression } from "../AST/Nodes/BinaryOperatorExpression";
import { Expression } from "../AST/Nodes/Expression";
import { ExpressionWrapper } from "../AST/Nodes/ExpressionWrapper";
import { FloatingPointLiteralExpression } from "../AST/Nodes/FloatingPointLiteralExpression";
import { IdentifierCallExpression } from "../AST/Nodes/IdentifierCallExpression";
import { IntegerLiteralExpression } from "../AST/Nodes/IntegerLiteralExpression";
import { PlaceholderExpression } from "../AST/Nodes/PlaceholderExpression";
import { PostfixUnaryOperatorExpression } from "../AST/Nodes/PostfixUnaryOperatorExpression";
import { SourceFile } from "../AST/Nodes/SourceFile";
import { StringLiteralExpression } from "../AST/Nodes/StringLiteralExpression";
import { VariableReferenceExpression } from "../AST/Nodes/VariableReferenceExpression";
import { Lexer } from "../Lexer/Lexer";
import { PlaceholderToken } from "../Lexer/PlaceholderToken";
import { TokenTag } from "../Lexer/TokenTag";
import { CompilerError, ExpressionParsingTerminatedError, LValueRequired, UnknownOperatorError, WrongTokenError } from "../Parser/ParserError";
import { InfixOperatorEntry, OperatorScope, PostfixOperatorEntry } from "./OperatorScope";

class ExpressionLexer extends Lexer {
  constructor(sourcePath: string, sourceString: string) {
    super(sourcePath, sourceString);
    this.whitespaceRegex = /([ \t]+|(\r\n|\r|\n)+)+/g;
  }
}
export class ExpressionParser extends ASTWalker {
  public sourceFile: SourceFile;
  public errors: CompilerError[];
  private operatorScope: OperatorScope = new OperatorScope();
  constructor(sourceFile: SourceFile, errors: CompilerError[]) {
    super();
    this.sourceFile = sourceFile;
    this.errors = errors;
  }
  public parseExpressions() {
    this.walkSourceFile(this.sourceFile);
  }
  public parseExpressionWrapper(wrapper: ExpressionWrapper) {
    this.operatorScope = wrapper.operatorScope;
    const source = wrapper.raw;
    const lexer = new ExpressionLexer(wrapper.tokens[0].range.sourcePath, source);
    lexer.line = wrapper.tokens[0].range.start.line;
    lexer.column = wrapper.tokens[0].range.start.column;
    const expression = this.parseExpressionOrAssignment(lexer);
    wrapper.setExpression(expression);
    if (!lexer.eof()) {
      const placeholderToken = new PlaceholderToken(lexer);
      this.errors.push(new ExpressionParsingTerminatedError(placeholderToken.range));
    }
  }
  public parseExpressionOrAssignment(lexer: ExpressionLexer, precedence: number = 0): Expression | AssignmentStatement {
    lexer.whitespace();
    let left: Expression | AssignmentStatement = this.parsePrefix(lexer);
    lexer.whitespace();
    while (precedence < this.getPrecedence(lexer) && !lexer.eof()) {
      left = this.infixParseExpressionOrAssignment(lexer, left);
      if (left instanceof AssignmentStatement) {
        break;
      }
      lexer.whitespace();
    }
    return left;
  }
  public infixParseExpressionOrAssignment(lexer: ExpressionLexer, left: Expression): Expression | AssignmentStatement {
    const assignmentToken = lexer.assignment();
    if (assignmentToken !== undefined) {
      lexer.whitespace();
      const value = this.parseExpression(lexer, 1);
      const lvalue = left as unknown as ILValue;
      if (Object.prototype.hasOwnProperty.call(lvalue, "lvalue")) {
        return new AssignmentStatement(lvalue, assignmentToken, value);
      } else {
        this.errors.push(new LValueRequired(assignmentToken.range));
        return new AssignmentStatement(lvalue, assignmentToken, value);
      }
    }
    return this.infixParseExpression(lexer, left);
  }
  public infixParseExpression(lexer: ExpressionLexer, left: Expression): Expression {
    const leftParenthesis = lexer.leftParenthesis();
    if (leftParenthesis !== undefined) {
      const parsedArguments: Expression[] = [];
      let first = true;
      let rightParenthesis = lexer.rightParenthesis() || new PlaceholderToken(lexer);
      while (rightParenthesis instanceof PlaceholderToken) {
        lexer.whitespace();
        if (!first) {
          const comma = lexer.comma() || new PlaceholderToken(lexer);
          if (comma instanceof PlaceholderToken) {
            this.errors.push(new WrongTokenError(comma.range, [TokenTag.comma]));
          }
          lexer.whitespace();
        }
        first = false;
        const expression = this.parseExpression(lexer);
        parsedArguments.push(expression);

        rightParenthesis = lexer.rightParenthesis() || new PlaceholderToken(lexer);
      }
      if (left instanceof VariableReferenceExpression) {
        const callExpression = new IdentifierCallExpression(left, parsedArguments);
        return callExpression;
      }
      const placeholderToken = new PlaceholderToken(lexer);
      return new PlaceholderExpression(placeholderToken);
    }
    const operator = lexer.operator();
    if (operator !== undefined) {
      const str = operator.content;
      const postfixEntry = this.operatorScope.resolvePostfix(str);
      if (postfixEntry === undefined) {
        this.errors.push(new UnknownOperatorError(operator.range, str));
        return new PlaceholderExpression(operator);
      }
      if (postfixEntry instanceof PostfixOperatorEntry) {
        return new PostfixUnaryOperatorExpression(left, operator);
      }
      if (postfixEntry instanceof InfixOperatorEntry) {
        const precedence = postfixEntry.precedence;
        const leftAssociative = postfixEntry.leftAssociative;
        const right = this.parseExpression(lexer, precedence + (leftAssociative ? 0.1 : 0));
        return new BinaryOperatorExpression(left, right, operator);
      }
    }
    return new PlaceholderExpression(new PlaceholderToken(lexer));
  }
  public parseExpression(lexer: ExpressionLexer, precedence: number = 0): Expression {
    lexer.whitespace();
    let left = this.parsePrefix(lexer);
    lexer.whitespace();
    while (precedence < this.getPrecedence(lexer) && !lexer.eof()) {
      left = this.infixParseExpression(lexer, left);
      lexer.whitespace();
    }
    return left;
  }
  public getPrecedence(lexer: ExpressionLexer): number {
    const assignmentToken = lexer.assignment(false);
    if (assignmentToken !== undefined) {
      return 1;
    }
    const leftParenthesis = lexer.leftParenthesis(false);
    if (leftParenthesis !== undefined) {
      return 8;
    }
    const operatorToken = lexer.operator(false);
    if (operatorToken !== undefined) {
      const str = operatorToken.content;
      const operator = this.operatorScope.resolvePostfix(str);
      if (operator !== undefined) {
        if (operator instanceof PostfixOperatorEntry) {
          return 7;
        }
        if (operator instanceof InfixOperatorEntry) {
          return operator.precedence;
        }
      } else {
        throw new Error();
      }
    }
    return 0;
  }
  public parsePrefix(lexer: ExpressionLexer): Expression {
    const leftParenthesis = lexer.leftParenthesis();
    if (leftParenthesis !== undefined) {
      lexer.whitespace();
      const enclosedExpression = this.parseExpression(lexer);
      lexer.whitespace();
      const rightParenthesis = lexer.rightParenthesis();
      lexer.whitespace();
      if (rightParenthesis === undefined) {
        const placeholderToken = new PlaceholderToken(lexer);
        this.errors.push(new WrongTokenError(placeholderToken.range, [TokenTag.rightParenthesis]));
      }
      return enclosedExpression;
    }
    const integerLiteralToken = lexer.integerLiteral();
    if (integerLiteralToken !== undefined) {
      const integerLiteralExpression = new IntegerLiteralExpression(integerLiteralToken);
      return integerLiteralExpression;
    }
    const stringLiteralToken = lexer.stringLiteral();
    if (stringLiteralToken !== undefined) {
      const stringLiteralExpression = new StringLiteralExpression(stringLiteralToken);
      return stringLiteralExpression;
    }
    const floatingPointLiteralToken = lexer.floatingPointLiteral();
    if (floatingPointLiteralToken !== undefined) {
      const floatingPointLiteralExpression = new FloatingPointLiteralExpression(floatingPointLiteralToken);
      return floatingPointLiteralExpression;
    }
    const identifierToken = lexer.identifier();
    if (identifierToken !== undefined) {
      const variableReferenceExpression = new VariableReferenceExpression(identifierToken);
      return variableReferenceExpression;
    }
    const errorPlaceholderToken = new PlaceholderToken(lexer);
    const placeholderExpression = new PlaceholderExpression(errorPlaceholderToken);
    this.errors.push(new WrongTokenError(errorPlaceholderToken.range, [TokenTag.leftParenthesis, TokenTag.integerLiteral, TokenTag.floatingPointLiteral, TokenTag.stringLiteral]));
    return placeholderExpression;
  }
  protected walkExpressionWrapper(wrapper: ExpressionWrapper) {
    console.log(wrapper.raw);
    this.parseExpressionWrapper(wrapper);
    wrapper.parsed = true;
  }
}
