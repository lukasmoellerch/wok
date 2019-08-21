import { AssignmentStatement } from "../AST/Nodes/AssignmentStatement";
import { Block } from "../AST/Nodes/Block";
import { ConstantDeclaration } from "../AST/Nodes/ConstantDeclaration";
import { Expression } from "../AST/Nodes/Expression";
import { ExpressionWrapper } from "../AST/Nodes/ExpressionWrapper";
import { FloatingPointLiteralExpression } from "../AST/Nodes/FloatingPointLiteralExpression";
import { IfStatement } from "../AST/Nodes/IfStatement";
import { IntegerLiteralExpression } from "../AST/Nodes/IntegerLiteralExpression";
import { PlaceholderExpression } from "../AST/Nodes/PlaceholderExpression";
import { SourceFile } from "../AST/Nodes/SourceFile";
import { StringLiteralExpression } from "../AST/Nodes/StringLiteralExpression";
import { UnboundFunctionDeclaration } from "../AST/Nodes/UnboundFunctionDeclaration";
import { VariableDeclaration } from "../AST/Nodes/VariableDeclaration";
import { WhileStatement } from "../AST/Nodes/WhileStatement";
import { Lexer } from "../Lexer/Lexer";
import { PlaceholderToken } from "../Lexer/PlaceholderToken";
import { TokenTag } from "../Lexer/Token";
import { ParserError, WrongTokenError } from "../Parser/ParserError";

class ExpressionLexer extends Lexer {
  constructor(sourcePath: string, sourceString: string) {
    super(sourcePath, sourceString);
    this.whitespaceRegex = /([ \t]+|(\r\n|\r|\n)+)+/g;
  }
}
export class ExpressionParser {
  public sourceFile: SourceFile;
  public errors: ParserError[];
  constructor(sourceFile: SourceFile, errors: ParserError[]) {
    this.sourceFile = sourceFile;
    this.errors = errors;
  }
  public parseExpressions() {
    for (const topLevelDeclaration of this.sourceFile.topLevelDeclarations) {
      if (topLevelDeclaration instanceof UnboundFunctionDeclaration) {
        this.traverseBlock(topLevelDeclaration.block);
      }
    }
  }
  public traverseBlock(block: Block) {
    for (const statement of block.statements) {
      if (statement instanceof IfStatement) {
        this.traverseBlock(statement.block);
      }
      if (statement instanceof WhileStatement) {
        this.traverseBlock(statement.block);
      }
      if (statement instanceof VariableDeclaration) {
        this.parseExpressionWrapper(statement.value);
      }
      if (statement instanceof ConstantDeclaration) {
        this.parseExpressionWrapper(statement.value);
      }
      if (statement instanceof ExpressionWrapper) {
        this.parseExpressionWrapper(statement);
      }
    }
  }
  public parseExpressionWrapper(wrapper: ExpressionWrapper) {
    const source = wrapper.raw;
    console.log(JSON.stringify(source));
    const lexer = new ExpressionLexer(wrapper.tokens[0].range.sourcePath, source);
    lexer.line = wrapper.tokens[0].range.start.line;
    lexer.column = wrapper.tokens[0].range.start.column;
    const expression = this.parseExpressionOrAssignment(lexer);
    wrapper.setExpression(expression);
  }
  public parseExpressionOrAssignment(lexer: ExpressionLexer, precedence: number = 0): Expression | AssignmentStatement {
    const left = this.parsePrefix(lexer);
    return left;
  }
  public parseExpression(lexer: ExpressionLexer, precedence: number = 0): Expression {
    const left = this.parsePrefix(lexer);
    return left;
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
}
