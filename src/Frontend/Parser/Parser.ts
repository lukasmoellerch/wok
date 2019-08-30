import { ITopLevelDeclaration } from "../AST/AST";
import { Block } from "../AST/Nodes/Block";
import { ConstantDeclaration } from "../AST/Nodes/ConstantDeclaration";
import { Decorator } from "../AST/Nodes/Decorator";
import { ExpressionWrapper } from "../AST/Nodes/ExpressionWrapper";
import { FunctionArgumentDeclaration } from "../AST/Nodes/FunctionArgumentDeclaration";
import { FunctionResultDeclaration } from "../AST/Nodes/FunctionResultDeclaration";
import { IfStatement } from "../AST/Nodes/IfStatement";
import { InfixOperatorDeclaration } from "../AST/Nodes/InfixOperatorDeclaration";
import { PostfixOperatorDeclaration } from "../AST/Nodes/PostfixOperatorDeclaration";
import { PrefixOperatorDeclaration } from "../AST/Nodes/PrefixOperatorDeclaration";
import { SourceFile } from "../AST/Nodes/SourceFile";
import { Statement } from "../AST/Nodes/Statement";
import { UnboundFunctionDeclaration } from "../AST/Nodes/UnboundFunctionDeclaration";
import { VariableDeclaration } from "../AST/Nodes/VariableDeclaration";
import { WhileStatement } from "../AST/Nodes/WhileStatement";
import { Lexer } from "../Lexer/Lexer";
import { PlaceholderToken } from "../Lexer/PlaceholderToken";
import { Token } from "../Lexer/Token";
import { TokenTag } from "../Lexer/TokenTag";
import { TypeExpression } from "../Type/UnresolvedType/TypeExpression";
import { TypeReferenceExpression } from "../Type/UnresolvedType/TypeReferenceExpression";
import { CompilerError, ExpectedExpression, WrongTokenError } from "./ParserError";
export class Parser {
  public lexer: Lexer;
  public errors: CompilerError[] = [];
  constructor(lexer: Lexer) {
    this.lexer = lexer;
  }
  public parseSourceFile(): SourceFile {
    const topLevelDeclarations: ITopLevelDeclaration[] = [];
    while (!this.lexer.eof()) {
      const declaration = this.parseDecoratedTopLevelDeclaration();
      if (declaration === undefined) {
        this.lexer.advance(" ");
      } else {
        topLevelDeclarations.push(declaration);
      }
    }
    const sourceFile = new SourceFile(topLevelDeclarations);
    return sourceFile;
  }
  public parseDecoratedTopLevelDeclaration(): ITopLevelDeclaration | undefined {
    const at = this.lexer.at(false);
    if (at === undefined) {
      return this.parseUndecoratedTopLevelDeclaration([]);
    } else {
      const decorators = this.parseDecoratorList();
      this.lexer.whitespace();
      return this.parseUndecoratedTopLevelDeclaration(decorators);
    }
    return undefined;
  }
  public parseUndecoratedTopLevelDeclaration(decorators: Decorator[]): ITopLevelDeclaration | undefined {
    this.lexer.whitespace();
    const functionToken = this.lexer.keyword("func");
    if (functionToken !== undefined) {
      const functionDeclaration = this.parseFunction(decorators, functionToken);
      return functionDeclaration;
    }
    const prefixToken = this.lexer.keyword("prefix");
    if (prefixToken !== undefined) {
      const prefixOperatorDeclaration = this.parsePrefixOperatorDeclaration(prefixToken);
      return prefixOperatorDeclaration;
    }
    const infixToken = this.lexer.keyword("infix");
    if (infixToken !== undefined) {
      const infixOperatorDeclaration = this.parseInfixOperatorDeclaration(infixToken);
      return infixOperatorDeclaration;
    }
    const postfixToken = this.lexer.keyword("postfix");
    if (postfixToken !== undefined) {
      const postfixOperatorDeclaration = this.parsePostfixOperatorDeclaration(postfixToken);
      return postfixOperatorDeclaration;
    }
    return undefined;
  }
  public parseFunction(decorators: Decorator[], functionKeywordToken: Token): UnboundFunctionDeclaration {
    const ws = this.lexer.whitespace();
    const nameToken = this.lexer.identifier() || new PlaceholderToken(this.lexer);
    if (nameToken instanceof PlaceholderToken) {
      this.errors.push(new WrongTokenError(nameToken.range, [TokenTag.identifier]));
    }
    const argumentDeclarations = this.parseFunctionArgumentDeclarationList();
    this.lexer.whitespace();
    const colon = this.lexer.colon();
    this.lexer.whitespace();
    if (colon !== undefined) {
      const type = this.parseType();
      let block: Block | undefined;
      this.lexer.whitespace();
      const leftCurly = this.lexer.leftCurlyBracket(false);
      if (leftCurly) {
        block = this.parseBlock();
      }
      const resultDeclaration = new FunctionResultDeclaration(type);
      return new UnboundFunctionDeclaration(decorators, functionKeywordToken, nameToken, argumentDeclarations, block, resultDeclaration);
    } else {
      let block: Block | undefined;
      this.lexer.whitespace();
      const leftCurly = this.lexer.leftCurlyBracket(false);
      if (leftCurly) {
        block = this.parseBlock();
      }
      return new UnboundFunctionDeclaration(decorators, functionKeywordToken, nameToken, argumentDeclarations, block);
    }
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
    const ifKeyword = this.lexer.keyword("if");
    if (ifKeyword !== undefined) {
      return this.parseIfStatement(ifKeyword);
    }
    const whileKEyword = this.lexer.keyword("while");
    if (whileKEyword !== undefined) {
      return this.parseWhileStatement(whileKEyword);
    }
    const constantKeyword = this.lexer.keyword("const");
    if (constantKeyword !== undefined) {
      return this.parseConstantDeclaration(constantKeyword);
    }
    const variableKeyword = this.lexer.keyword("var");
    if (variableKeyword !== undefined) {
      return this.parseVariableDeclaration(variableKeyword);
    }
    return this.parseExpressionWrapper();
  }
  public parseExpressionWrapper(): ExpressionWrapper | undefined {
    const tokens = this.parseExpressionTokensUntilNewline();
    if (tokens.length === 0) {
      return undefined;
    }
    return new ExpressionWrapper(tokens);
  }
  public parseExpressionTokensUntilCommaOrRightParenthesis(): { tokens: Token[], closingToken: Token } {
    let tokens: Token[] = [];
    let closingToken = this.lexer.rightParenthesis() || this.lexer.comma() || new PlaceholderToken(this.lexer);
    this.lexer.whitespace();
    while (closingToken instanceof PlaceholderToken && !this.lexer.eof()) {
      const leftParenthesisToken = this.lexer.leftParenthesis();
      if (leftParenthesisToken !== undefined) {
        const t = this.parseExpressionTokensUntilClosed(leftParenthesisToken);
        tokens = tokens.concat(t);
        continue;
      }
      const nextExpressionToken = this.parseNextExpressionToken();
      this.lexer.whitespace();
      if (nextExpressionToken === undefined) {
        closingToken = this.lexer.rightParenthesis() || this.lexer.comma() || new PlaceholderToken(this.lexer);
        break;
      }
      tokens.push(nextExpressionToken);
      closingToken = this.lexer.rightParenthesis() || this.lexer.comma() || new PlaceholderToken(this.lexer);
    }
    if (closingToken instanceof PlaceholderToken) {
      this.errors.push(new WrongTokenError(closingToken.range, [TokenTag.rightParenthesis, TokenTag.comma]));
    }
    return { tokens, closingToken };
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
  public parseIfStatement(ifKeyword: Token): IfStatement {
    this.lexer.whitespace();
    const { tokens, leftCurlyBracket } = this.parseExpressionTokensUntilBlock();
    const condition = new ExpressionWrapper(tokens);
    this.lexer.whitespace();
    const block = this.parseBlock(leftCurlyBracket);
    this.lexer.lineBreak();
    return new IfStatement(ifKeyword, condition, block);
  }
  public parseWhileStatement(whileKeyword: Token): WhileStatement {
    this.lexer.whitespace();
    const { tokens, leftCurlyBracket } = this.parseExpressionTokensUntilBlock();
    const condition = new ExpressionWrapper(tokens);
    this.lexer.whitespace();
    const block = this.parseBlock(leftCurlyBracket);
    this.lexer.lineBreak();
    return new WhileStatement(whileKeyword, condition, block);
  }
  public parseForStatement() {
    return;
  }
  public parseConstantDeclaration(constantKeyword: Token): ConstantDeclaration {
    this.lexer.whitespace();
    const identifier = this.lexer.identifier() || new PlaceholderToken(this.lexer);
    if (identifier instanceof PlaceholderToken) {
      this.errors.push(new WrongTokenError(identifier.range, [TokenTag.identifier]));
    }
    this.lexer.whitespace();
    const colon = this.lexer.colon();
    if (colon !== undefined) {
      this.lexer.whitespace();
      const typeHint = this.parseType();
      this.lexer.whitespace();
      const assignmentOperator = this.lexer.assignment() || new PlaceholderToken(this.lexer);
      if (assignmentOperator instanceof PlaceholderToken) {
        this.errors.push(new WrongTokenError(assignmentOperator.range, [TokenTag.assignment]));
      }
      this.lexer.whitespace();
      const value = this.parseExpressionWrapper() || new ExpressionWrapper([]);
      if (value.tokens.length === 0) {
        this.errors.push(new ExpectedExpression(new PlaceholderToken(this.lexer).range));
      }
      return new ConstantDeclaration(constantKeyword, identifier, colon, typeHint, assignmentOperator, value);
    } else {
      const assignmentOperator = this.lexer.assignment() || new PlaceholderToken(this.lexer);
      if (assignmentOperator instanceof PlaceholderToken) {
        this.errors.push(new WrongTokenError(assignmentOperator.range, [TokenTag.assignment]));
      }
      this.lexer.whitespace();
      const value = this.parseExpressionWrapper() || new ExpressionWrapper([]);
      if (value.tokens.length === 0) {
        this.errors.push(new ExpectedExpression(new PlaceholderToken(this.lexer).range));
      }
      return new ConstantDeclaration(constantKeyword, identifier, undefined, undefined, assignmentOperator, value);
    }
  }
  public parseVariableDeclaration(variableKeyword: Token): VariableDeclaration {
    this.lexer.whitespace();
    const identifier = this.lexer.identifier() || new PlaceholderToken(this.lexer);
    if (identifier instanceof PlaceholderToken) {
      this.errors.push(new WrongTokenError(identifier.range, [TokenTag.identifier]));
    }
    this.lexer.whitespace();
    const colon = this.lexer.colon();
    if (colon !== undefined) {
      this.lexer.whitespace();
      const typeHint = this.parseType();
      this.lexer.whitespace();
      const assignmentOperator = this.lexer.assignment() || new PlaceholderToken(this.lexer);
      if (assignmentOperator instanceof PlaceholderToken) {
        this.errors.push(new WrongTokenError(assignmentOperator.range, [TokenTag.assignment]));
      }
      this.lexer.whitespace();
      const value = this.parseExpressionWrapper() || new ExpressionWrapper([]);
      if (value.tokens.length === 0) {
        this.errors.push(new ExpectedExpression(new PlaceholderToken(this.lexer).range));
      }
      return new VariableDeclaration(variableKeyword, identifier, colon, typeHint, assignmentOperator, value);
    } else {
      const assignmentOperator = this.lexer.assignment() || new PlaceholderToken(this.lexer);
      if (assignmentOperator instanceof PlaceholderToken) {
        this.errors.push(new WrongTokenError(assignmentOperator.range, [TokenTag.assignment]));
      }
      this.lexer.whitespace();
      const value = this.parseExpressionWrapper() || new ExpressionWrapper([]);
      if (value.tokens.length === 0) {
        this.errors.push(new ExpectedExpression(new PlaceholderToken(this.lexer).range));
      }
      return new VariableDeclaration(variableKeyword, identifier, undefined, undefined, assignmentOperator, value);
    }
  }
  public parsePrefixOperatorDeclaration(keyword: Token): PrefixOperatorDeclaration {
    this.lexer.whitespace();
    const operatorKeyword = this.lexer.keyword("operator") || new PlaceholderToken(this.lexer);
    if (operatorKeyword instanceof PlaceholderToken) {
      this.errors.push(new WrongTokenError(operatorKeyword.range, ["operator"]));
    }
    this.lexer.whitespace();
    const operatorToken = this.lexer.operator() || new PlaceholderToken(this.lexer);
    if (operatorToken instanceof PlaceholderToken) {
      this.errors.push(new WrongTokenError(operatorToken.range, [TokenTag.operator]));
    }
    const lineBreak = this.lexer.lineBreak() || new PlaceholderToken(this.lexer);
    if (lineBreak instanceof PlaceholderToken) {
      this.errors.push(new WrongTokenError(lineBreak.range, [TokenTag.lineBreak]));
    }
    return new PrefixOperatorDeclaration(keyword, operatorKeyword, operatorToken);
  }
  public parsePostfixOperatorDeclaration(keyword: Token): PostfixOperatorDeclaration {
    this.lexer.whitespace();
    const operatorKeyword = this.lexer.keyword("operator") || new PlaceholderToken(this.lexer);
    if (operatorKeyword instanceof PlaceholderToken) {
      this.errors.push(new WrongTokenError(operatorKeyword.range, ["operator"]));
    }
    this.lexer.whitespace();
    const operatorToken = this.lexer.operator() || new PlaceholderToken(this.lexer);
    if (operatorToken instanceof PlaceholderToken) {
      this.errors.push(new WrongTokenError(operatorToken.range, [TokenTag.operator]));
    }
    const lineBreak = this.lexer.lineBreak() || new PlaceholderToken(this.lexer);
    if (lineBreak instanceof PlaceholderToken) {
      this.errors.push(new WrongTokenError(lineBreak.range, [TokenTag.lineBreak]));
    }
    return new PostfixOperatorDeclaration(keyword, operatorKeyword, operatorToken);
  }
  public parseInfixOperatorDeclaration(keyword: Token): InfixOperatorDeclaration {
    this.lexer.whitespace();
    const operatorKeyword = this.lexer.keyword("operator") || new PlaceholderToken(this.lexer);
    if (operatorKeyword instanceof PlaceholderToken) {
      this.errors.push(new WrongTokenError(operatorKeyword.range, ["operator"]));
    }
    this.lexer.whitespace();
    const operatorToken = this.lexer.operator() || new PlaceholderToken(this.lexer);
    if (operatorToken instanceof PlaceholderToken) {
      this.errors.push(new WrongTokenError(operatorToken.range, [TokenTag.operator]));
    }
    this.lexer.whitespace();
    const precedence = this.lexer.integerLiteral() || new PlaceholderToken(this.lexer);
    if (precedence instanceof PlaceholderToken) {
      this.errors.push(new WrongTokenError(precedence.range, [TokenTag.integerLiteral]));
    }
    this.lexer.whitespace();
    const assoc = this.lexer.keyword("left") || this.lexer.keyword("right") || new PlaceholderToken(this.lexer);
    if (assoc instanceof PlaceholderToken) {
      this.errors.push(new WrongTokenError(assoc.range, ["left", "right"]));
    }
    this.lexer.whitespace();
    const lineBreak = this.lexer.lineBreak() || new PlaceholderToken(this.lexer);
    if (lineBreak instanceof PlaceholderToken) {
      this.errors.push(new WrongTokenError(lineBreak.range, [TokenTag.lineBreak]));
    }
    return new InfixOperatorDeclaration(keyword, operatorKeyword, operatorToken, precedence, assoc);
  }
  public parseDecoratorList(): Decorator[] {
    this.lexer.whitespace();
    const decorators: Decorator[] = [];
    let atToken = this.lexer.at() || new PlaceholderToken(this.lexer);
    while (!(atToken instanceof PlaceholderToken)) {
      const nameToken = this.lexer.identifier() || new PlaceholderToken(this.lexer);
      if (nameToken instanceof PlaceholderToken) {
        this.errors.push(new WrongTokenError(nameToken.range, [TokenTag.identifier]));
      }
      const leftParenthesis = this.lexer.leftParenthesis() || new PlaceholderToken(this.lexer);
      if (leftParenthesis instanceof PlaceholderToken) {
        const decorator = new Decorator(nameToken, []);
        decorators.push(decorator);
        this.lexer.whitespace();
        atToken = this.lexer.at() || new PlaceholderToken(this.lexer);
        continue;
      } else {
        const parameterList: ExpressionWrapper[] = [];
        let forceNextParameter = false;
        while (true) {
          this.lexer.whitespace();
          if (!forceNextParameter) {
            const rightParenthesis = this.lexer.rightParenthesis();
            if (rightParenthesis !== undefined) {
              this.lexer.whitespace();
              break;
            }
          }
          const { tokens, closingToken } = this.parseExpressionTokensUntilCommaOrRightParenthesis();
          const wrapper = new ExpressionWrapper(tokens, false);
          parameterList.push(wrapper);
          if (closingToken.tag === TokenTag.comma) {
            forceNextParameter = true;
            this.lexer.whitespace();
            atToken = this.lexer.at() || new PlaceholderToken(this.lexer);
            continue;
          } else {
            this.lexer.whitespace();
            break;
          }
        }
        const decorator = new Decorator(nameToken, parameterList);
        decorators.push(decorator);
        this.lexer.whitespace();
        atToken = this.lexer.at() || new PlaceholderToken(this.lexer);
        continue;
      }
    }
    return decorators;
  }
}
