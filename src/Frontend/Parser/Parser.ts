import { ITopLevelDeclaration } from "../AST/AST";
import { Block } from "../AST/Nodes/Block";
import { ExpressionWrapper } from "../AST/Nodes/EpxressionWrapper";
import { FunctionArgumentDeclaration } from "../AST/Nodes/FunctionArgumentDeclaration";
import { SourceFile } from "../AST/Nodes/SourceFile";
import { Statement } from "../AST/Nodes/Statement";
import { UnboundFunctionDeclaration } from "../AST/Nodes/UnboundFunctionDeclaration";
import { Lexer } from "../Lexer/Lexer";
import { PlaceholderToken } from "../Lexer/PlaceholderToken";
import { Token, TokenTag } from "../Lexer/Token";
import { TypeExpression } from "../Type/UnresolvedType/TypeExpression";
import { TypeReferenceExpression } from "../Type/UnresolvedType/TypeReferenceExpression";
import { ParserError, WrongTokenError } from "./ParserError";
export class Parser {
  public lexer: Lexer;
  public errors: ParserError[] = [];
  constructor(lexer: Lexer) {
    this.lexer = lexer;
  }
  public parseSourceFile(): SourceFile {
    const topLevelDeclarations: ITopLevelDeclaration[] = [];
    while (!this.lexer.eof()) {
      this.lexer.whitespace();
      const functionToken = this.lexer.keyword("function");
      if (functionToken !== undefined) {
        const functionDeclaration = this.parseFunction(functionToken);
        topLevelDeclarations.push(functionDeclaration);
      } else {
        break;
      }
    }
    const sourceFile = new SourceFile(topLevelDeclarations);
    return sourceFile;
  }
  public parseFunction(functionKeywordToken: Token): UnboundFunctionDeclaration {
    const ws = this.lexer.whitespace();
    const nameToken = this.lexer.identifier() || new PlaceholderToken(this.lexer);
    if (nameToken instanceof PlaceholderToken) {
      this.errors.push(new WrongTokenError(nameToken.range, [TokenTag.identifier]));
    }
    const argumentDeclarations = this.parseFunctionArgumentDeclarationList();
    const block = this.parseBlock();
    return new UnboundFunctionDeclaration(functionKeywordToken, nameToken, argumentDeclarations, block);
  }
  public parseFunctionArgumentDeclarationList(): FunctionArgumentDeclaration[] {
    const declarations: FunctionArgumentDeclaration[] = [];
    const leftParenthesis = this.lexer.leftParenthesis() || new PlaceholderToken(this.lexer);
    if (leftParenthesis instanceof PlaceholderToken) {
      this.errors.push(new WrongTokenError(leftParenthesis.range, [TokenTag.leftParenthesis]));
    }
    let rightParenthesis = this.lexer.rightParenthesis();
    if (rightParenthesis === undefined) {
      const firstParameterDeclaration = this.parseFunctionArgumentDeclaration();
      declarations.push(firstParameterDeclaration);
      let commaToken: Token | undefined;
      while (true) {
        commaToken = this.lexer.comma();
        this.lexer.whitespace();
        if (commaToken === undefined) {
          break;
        }
        const argumentDeclaration = this.parseFunctionArgumentDeclaration();
        declarations.push(argumentDeclaration);
      }
      rightParenthesis = this.lexer.rightParenthesis() || new PlaceholderToken(this.lexer);
      if (rightParenthesis instanceof PlaceholderToken) {
        this.errors.push(new WrongTokenError(rightParenthesis.range, [TokenTag.rightParenthesis]));
      }
      return declarations;
    } else {
      return [];
    }
  }
  public parseFunctionArgumentDeclaration(): FunctionArgumentDeclaration {
    const argumentNameToken = this.lexer.identifier() || new PlaceholderToken(this.lexer);
    if (argumentNameToken instanceof PlaceholderToken) {
      this.errors.push(new WrongTokenError(argumentNameToken.range, [TokenTag.identifier]));
    }
    const colonToken = this.lexer.colon() || new PlaceholderToken(this.lexer);
    if (colonToken instanceof PlaceholderToken) {
      this.errors.push(new WrongTokenError(colonToken.range, [TokenTag.colon]));
    }
    this.lexer.whitespace();
    const type = this.parseType();
    return new FunctionArgumentDeclaration(argumentNameToken, type);
  }
  public parseType(): TypeExpression {
    const lhs: TypeExpression = this.parseTypeReferenceExpression();
    return lhs;
  }
  public parseTypeReferenceExpression(): TypeReferenceExpression {
    const nameToken = this.lexer.identifier() || new PlaceholderToken(this.lexer);
    if (nameToken instanceof PlaceholderToken) {
      this.errors.push(new WrongTokenError(nameToken.range, [TokenTag.identifier]));
    }
    return new TypeReferenceExpression(nameToken, []);
  }
  public parseBlock(leftCurlyBracket?: Token): Block {
    this.lexer.whitespace();
    if (leftCurlyBracket === undefined) {
      leftCurlyBracket = this.lexer.leftCurlyBracket() || new PlaceholderToken(this.lexer);

      if (leftCurlyBracket instanceof PlaceholderToken) {
        this.errors.push(new WrongTokenError(leftCurlyBracket.range, [TokenTag.leftCurlyBracket]));
      }
    }
    this.lexer.lineBreak();
    this.lexer.whitespace();
    const statements: Statement[] = [];
    let rightCurlyBracket = this.lexer.rightCurlyBracket() || new PlaceholderToken(this.lexer);
    while (rightCurlyBracket instanceof PlaceholderToken && !this.lexer.eof()) {
      const statement = this.parseStatement();
      if (statement === undefined) {
        break;
      }
      statements.push(statement);
      this.lexer.whitespace();
      rightCurlyBracket = this.lexer.rightCurlyBracket() || new PlaceholderToken(this.lexer);
    }
    this.lexer.whitespace();
    const endToken = rightCurlyBracket;
    if (endToken instanceof PlaceholderToken) {
      this.errors.push(new WrongTokenError(endToken.range, [TokenTag.rightCurlyBracket]));
    }
    this.lexer.lineBreak();
    return new Block(leftCurlyBracket, statements, endToken);

  }
  public parseStatement(): Statement | undefined {
    return this.parseExpressionWrapper();
  }
  public parseExpressionWrapper(): ExpressionWrapper | undefined {
    const tokens = this.parseExpressionTokensUntilNewline();
    if (tokens.length === 0) {
      return undefined;
    }
    return new ExpressionWrapper(tokens);
  }
  public parseExpressionTokensUntilBlock(): { tokens: Token[], leftCurlyBracket: Token } {
    let tokens: Token[] = [];
    let leftCurlyBracket = this.lexer.leftCurlyBracket() || new PlaceholderToken(this.lexer);
    this.lexer.whitespace();
    while (leftCurlyBracket instanceof PlaceholderToken && !this.lexer.eof()) {
      const leftParenthesisToken = this.lexer.leftParenthesis();
      if (leftParenthesisToken !== undefined) {
        const t = this.parseExpressionTokensUntilClosed(leftParenthesisToken);
        tokens = tokens.concat(t);
        continue;
      }
      const nextExpressionToken = this.parseNextExpressionToken();
      this.lexer.whitespace();
      if (nextExpressionToken === undefined) {
        leftCurlyBracket = this.lexer.leftCurlyBracket() || new PlaceholderToken(this.lexer);
        break;
      }
      tokens.push(nextExpressionToken);
      leftCurlyBracket = this.lexer.leftCurlyBracket() || new PlaceholderToken(this.lexer);
    }
    if (leftCurlyBracket instanceof PlaceholderToken) {
      this.errors.push(new WrongTokenError(leftCurlyBracket.range, [TokenTag.leftCurlyBracket]));
    }
    return { tokens, leftCurlyBracket };
  }
  public parseExpressionTokensUntilNewline(): Token[] {
    let tokens: Token[] = [];
    let lineBreak = this.lexer.lineBreak();
    this.lexer.whitespace();
    while (lineBreak === undefined && !this.lexer.eof()) {
      const leftParenthesisToken = this.lexer.leftParenthesis();
      if (leftParenthesisToken !== undefined) {
        const t = this.parseExpressionTokensUntilClosed(leftParenthesisToken);
        tokens = tokens.concat(t);
        continue;
      }
      const nextExpressionToken = this.parseNextExpressionToken();
      this.lexer.whitespace();
      if (nextExpressionToken === undefined) {
        this.lexer.lineBreak();
        break;
      }
      tokens.push(nextExpressionToken);
      lineBreak = this.lexer.lineBreak();
    }
    return tokens;
  }
  public parseExpressionTokensUntilClosed(a: Token): Token[] {
    let tokens: Token[] = [a];
    let rightParenthesisToken = this.lexer.rightParenthesis();
    this.lexer.whitespace();
    while (rightParenthesisToken === undefined) {
      const leftParenthesisToken = this.lexer.leftParenthesis();
      if (leftParenthesisToken !== undefined) {
        const t = this.parseExpressionTokensUntilClosed(leftParenthesisToken);
        tokens = tokens.concat(t);
        continue;
      }
      const nextExpressionToken = this.parseNextExpressionToken();
      this.lexer.whitespace();
      if (nextExpressionToken === undefined) {
        break;
      }
      tokens.push(nextExpressionToken);
      rightParenthesisToken = this.lexer.rightParenthesis();
    }
    if (rightParenthesisToken !== undefined) {
      tokens.push(rightParenthesisToken);
    }
    return tokens;
  }
  public parseNextExpressionToken(): Token | undefined {
    const identifierToken = this.lexer.identifier();
    if (identifierToken !== undefined) {
      return identifierToken;
    }
    const integerLiteralToken = this.lexer.integerLiteral();
    if (integerLiteralToken !== undefined) {
      return integerLiteralToken;
    }
    const floatingPointLiteralToken = this.lexer.floatingPointLiteral();
    if (floatingPointLiteralToken !== undefined) {
      return floatingPointLiteralToken;
    }
    const stringLiteralToken = this.lexer.stringLiteral();
    if (stringLiteralToken !== undefined) {
      return stringLiteralToken;
    }
    const booleanLiteralToken = this.lexer.booleanLiteral();
    if (booleanLiteralToken !== undefined) {
      return booleanLiteralToken;
    }
    const nilLiteralToken = this.lexer.nilLiteral();
    if (nilLiteralToken !== undefined) {
      return nilLiteralToken;
    }
    const operatorToken = this.lexer.operator();
    if (operatorToken !== undefined) {
      return operatorToken;
    }
    const dotOperatorToken = this.lexer.dotOperator();
    if (dotOperatorToken !== undefined) {
      return dotOperatorToken;
    }
    const commaOperatorToken = this.lexer.comma();
    if (commaOperatorToken !== undefined) {
      return commaOperatorToken;
    }
    return undefined;
  }
  public parseIfStatement() {
    this.lexer.whitespace();
    const { tokens, leftCurlyBracket } = this.parseExpressionTokensUntilBlock();
    const expressionWrapper = new ExpressionWrapper(tokens);
    this.lexer.whitespace();
    const block = this.parseBlock(leftCurlyBracket);
    this.lexer.lineBreak();

  }
  public parseWhileStatement() {

  }
  public parseForStatement() {

  }
  public parseConstantDeclaration() {

  }
  public parseVariableDeclaration() {

  }
}
