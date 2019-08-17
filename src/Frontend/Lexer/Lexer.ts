import { SourceLocation } from "./SourceLocation";
import { SourceRange } from "./SourceRange";
import { Token, TokenTag } from "./Token";

export enum TokenTagGroup {
  whitespace,
  comment,
  identifier,
  literal,
  operator,
  punctuation,
  keyword,
  placeholder,
}
export interface IGroupedString {
  group: TokenTagGroup;
  token: Token;
}

export class Lexer {
  public sourceString: string;
  private sourceStringOffset: number;
  private sourcePath: string;
  private line: number;
  private column: number;
  private newlineRegex = /(\r\n|\r|\n)/g;
  private whitespaceRegex = /[ \t]+/g;
  private lineBreakRegex = /(\r\n|\r|\n)+/g;
  private commentRegex = /\/\*(\*(?!\/)|[^*])*\*\//g;
  private identifierRegex = /[_a-zA-Z][_a-zA-Z0-9]*/g;
  private integerLiteralRegex = /(0|[1-9][0-9]*|0[oO]?[0-7]+|0[xX][0-9a-fA-F]+|0[bB][01]+)[lL]?/g;
  private floatingPointerLiteralRegex = /[+-]?([0-9]*[.])?[0-9]+/g;
  private stringLiteralRegex = /\"(([^\"]|\\\")*[^\\])?\"/g;
  private booleanLiteralRegex = /(true|false)/g;
  private nilLiteralRegex = /nil/g;
  private operatorRegex = /[=+!*%<>&|^~?-]+/g;
  private dotOperatorRegex = /\./g;
  private leftParenthesisRegex = /\(/g;
  private rightParenthesisRegex = /\)/g;
  private leftSquareBracketRegex = /\[/g;
  private rightSquareBracketRegex = /\]/g;
  private leftCurlyBracketRegex = /\{/g;
  private rightCurlyBracketRegex = /\}/g;
  private commaRegex = /\,/g;
  private colonRegex = /\:/g;
  private semicolonRegex = /\;/g;
  private assignmentRegex = /=/g;
  private atRegex = /@/g;
  private numberSignRegex = /#/g;
  private tokenizationMethods: Array<[TokenTag, (() => Token | undefined)]> = [
    [TokenTag.whitespace, this.whitespace],
    [TokenTag.lineBreak, this.lineBreak],
    [TokenTag.comment, this.comment],
    [TokenTag.identifier, this.identifier],
    [TokenTag.integerLiteral, this.integerLiteral],
    [TokenTag.floatingPointLiteral, this.floatingPointLiteral],
    [TokenTag.stringLiteral, this.stringLiteral],
    [TokenTag.booleanLiteral, this.booleanLiteral],
    [TokenTag.nilLiteral, this.nilLiteral],
    [TokenTag.operator, this.operator],
    [TokenTag.dotOperator, this.dotOperator],
    [TokenTag.leftParenthesis, this.leftParenthesis],
    [TokenTag.rightParenthesis, this.rightParenthesis],
    [TokenTag.leftSquareBracket, this.leftSquareBracket],
    [TokenTag.rightSquareBracket, this.rightSquareBracket],
    [TokenTag.leftCurlyBracket, this.leftCurlyBracket],
    [TokenTag.comma, this.comma],
    [TokenTag.colon, this.colon],
    [TokenTag.semicolon, this.semicolon],
    [TokenTag.assignment, this.assignment],
    [TokenTag.at, this.at],
    [TokenTag.numberSign, this.numberSign],
  ];
  private tokenizationMethodMap: Map<TokenTag, (() => Token | undefined)> = new Map(this.tokenizationMethods);
  private tokenTagGroups: Array<[TokenTag, TokenTagGroup]> = [
    [TokenTag.whitespace, TokenTagGroup.whitespace],
    [TokenTag.lineBreak, TokenTagGroup.whitespace],
    [TokenTag.comment, TokenTagGroup.comment],
    [TokenTag.identifier, TokenTagGroup.identifier],
    [TokenTag.integerLiteral, TokenTagGroup.literal],
    [TokenTag.floatingPointLiteral, TokenTagGroup.literal],
    [TokenTag.stringLiteral, TokenTagGroup.literal],
    [TokenTag.booleanLiteral, TokenTagGroup.literal],
    [TokenTag.nilLiteral, TokenTagGroup.literal],
    [TokenTag.operator, TokenTagGroup.operator],
    [TokenTag.dotOperator, TokenTagGroup.punctuation],
    [TokenTag.leftParenthesis, TokenTagGroup.punctuation],
    [TokenTag.rightParenthesis, TokenTagGroup.punctuation],
    [TokenTag.leftSquareBracket, TokenTagGroup.punctuation],
    [TokenTag.rightSquareBracket, TokenTagGroup.punctuation],
    [TokenTag.leftCurlyBracket, TokenTagGroup.punctuation],
    [TokenTag.comma, TokenTagGroup.punctuation],
    [TokenTag.colon, TokenTagGroup.punctuation],
    [TokenTag.semicolon, TokenTagGroup.punctuation],
    [TokenTag.assignment, TokenTagGroup.operator],
    [TokenTag.at, TokenTagGroup.punctuation],
    [TokenTag.numberSign, TokenTagGroup.punctuation],
    [TokenTag.placeholder, TokenTagGroup.placeholder],
    [TokenTag.keyword, TokenTagGroup.keyword],
  ];
  private tokenTagGroupsMap: Map<TokenTag, TokenTagGroup> = new Map(this.tokenTagGroups);
  private keywords = ["function", "String", "Int"];
  constructor(sourcePath: string, sourceString: string) {
    this.sourcePath = sourcePath;
    this.sourceString = sourceString;
    this.sourceStringOffset = 0;
    this.line = 1;
    this.column = 1;
  }
  public whitespace(): Token | undefined {
    return this.regexReturnToken(TokenTag.whitespace, this.whitespaceRegex);
  }
  public lineBreak(): Token | undefined {
    return this.regexReturnToken(TokenTag.lineBreak, this.lineBreakRegex);
  }
  public comment(): Token | undefined {
    return this.regexReturnToken(TokenTag.comment, this.commentRegex);
  }
  public identifier(): Token | undefined {
    return this.regexReturnToken(TokenTag.identifier, this.identifierRegex);
  }
  public integerLiteral(): Token | undefined {
    return this.regexReturnToken(TokenTag.integerLiteral, this.integerLiteralRegex);
  }
  public floatingPointLiteral(): Token | undefined {
    return this.regexReturnToken(TokenTag.floatingPointLiteral, this.floatingPointerLiteralRegex);
  }
  public stringLiteral(): Token | undefined {
    return this.regexReturnToken(TokenTag.stringLiteral, this.stringLiteralRegex);
  }
  public booleanLiteral(): Token | undefined {
    return this.regexReturnToken(TokenTag.booleanLiteral, this.booleanLiteralRegex);
  }
  public nilLiteral(): Token | undefined {
    return this.regexReturnToken(TokenTag.nilLiteral, this.nilLiteralRegex);
  }
  public operator(): Token | undefined {
    return this.regexReturnToken(TokenTag.operator, this.operatorRegex);
  }
  public dotOperator(): Token | undefined {
    return this.regexReturnToken(TokenTag.dotOperator, this.dotOperatorRegex);
  }
  public leftParenthesis(): Token | undefined {
    return this.regexReturnToken(TokenTag.dotOperator, this.leftParenthesisRegex);
  }
  public rightParenthesis(): Token | undefined {
    return this.regexReturnToken(TokenTag.dotOperator, this.rightParenthesisRegex);
  }
  public leftSquareBracket(): Token | undefined {
    return this.regexReturnToken(TokenTag.dotOperator, this.leftSquareBracketRegex);
  }
  public rightSquareBracket(): Token | undefined {
    return this.regexReturnToken(TokenTag.dotOperator, this.rightSquareBracketRegex);
  }
  public leftCurlyBracket(): Token | undefined {
    return this.regexReturnToken(TokenTag.dotOperator, this.leftCurlyBracketRegex);
  }
  public rightCurlyBracket(): Token | undefined {
    return this.regexReturnToken(TokenTag.dotOperator, this.rightCurlyBracketRegex);
  }
  public comma(): Token | undefined {
    return this.regexReturnToken(TokenTag.dotOperator, this.commaRegex);
  }
  public colon(): Token | undefined {
    return this.regexReturnToken(TokenTag.dotOperator, this.colonRegex);
  }
  public semicolon(): Token | undefined {
    return this.regexReturnToken(TokenTag.dotOperator, this.semicolonRegex);
  }
  public assignment(): Token | undefined {
    return this.regexReturnToken(TokenTag.dotOperator, this.assignmentRegex);
  }
  public at(): Token | undefined {
    return this.regexReturnToken(TokenTag.dotOperator, this.atRegex);
  }
  public numberSign(): Token | undefined {
    return this.regexReturnToken(TokenTag.dotOperator, this.numberSignRegex);
  }
  public keyword(str: string): Token | undefined {
    const start = this.getCurrentLocation();
    const result = this.regex(this.identifierRegex);
    if (result === undefined) {
      return undefined;
    }
    if (result !== str) {
      return undefined;
    }
    this.advance(result);
    const end = this.getCurrentLocation();
    const range = new SourceRange(start, end);
    const token = new Token(TokenTag.keyword, result, range);
    return token;
  }
  public character(str: string): Token | undefined {
    const start = this.getCurrentLocation();
    const result = this.regex(new RegExp(str, "g"));
    if (result === undefined) {
      return undefined;
    }
    if (result !== str) {
      return undefined;
    }
    this.advance(result);
    const end = this.getCurrentLocation();
    const range = new SourceRange(start, end);
    const token = new Token(TokenTag.keyword, result, range);
    return token;
  }
  public eof(): boolean {
    return this.sourceStringOffset >= this.sourceString.length;
  }
  public getCurrentLocation(): SourceLocation {
    return new SourceLocation(this.sourcePath, this.sourceString, this.sourceStringOffset, this.line, this.column);
  }
  public advance(str: string) {
    this.sourceStringOffset += str.length;
    this.newlineRegex.lastIndex = 0;
    let lastMatchEnd = 0;
    let result;
    result = this.newlineRegex.exec(str);
    while (result) {
      this.line++;
      this.column = 0;
      lastMatchEnd = result.index + result[0].length;
      result = this.newlineRegex.exec(str);
    }
    this.column += str.length - lastMatchEnd;
    return;
  }
  public tokenize(): Token[] {
    const tokens: Token[] = [];
    while (!this.eof()) {
      const token = this.nextToken();
      if (token === undefined) {
        break;
      }
      tokens.push(token);
    }
    return tokens;
  }
  public group(): IGroupedString[] {
    return this.tokenize().map((a) => this.groupToken(a));
  }
  private groupToken(token: Token): IGroupedString {
    const group = this.tokenTagGroupsMap.get(token.tag);
    if (group === undefined) {
      throw new Error();
    }
    return {
      group,
      token,
    };
  }

  private regex(regex: RegExp): string | undefined {
    regex.lastIndex = this.sourceStringOffset;
    const result = regex.exec(this.sourceString);
    if (result === null) {
      return undefined;
    }
    if (result.index !== this.sourceStringOffset) {
      return undefined;
    }
    const str = result[0];
    return str;
  }
  private regexAndAdvance(regex: RegExp): string | undefined {
    const result = this.regex(regex);
    if (result === undefined) {
      return undefined;
    }
    this.advance(result);
    return result;
  }
  private regexReturnToken(tag: TokenTag, regex: RegExp): Token | undefined {
    const start = this.getCurrentLocation();
    const content = this.regexAndAdvance(regex);
    if (content === undefined) {
      return undefined;
    }
    const end = this.getCurrentLocation();
    const range = new SourceRange(start, end);
    const token = new Token(tag, content, range);
    return token;
  }
  private nextToken(): Token | undefined {
    for (const entry of this.tokenizationMethods) {
      const token = entry[1].apply(this);
      if (token === undefined) {
        continue;
      }
      if (entry[0] === TokenTag.identifier) {
        if (this.keywords.indexOf(token.content) !== -1) {
          return new Token(TokenTag.keyword, token.content, token.range);
        }
      }
      return token;
    }
    return undefined;
  }

}
