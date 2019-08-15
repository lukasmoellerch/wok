import { SourceLocation } from "./SourceLocation";
import { SourceRange } from "./SourceRange";
import { Token, TokenTag } from "./Token";

export class Lexer {
  private sourceString: string;
  private sourceStringOffset: number;
  private sourcePath: string;
  private line: number;
  private column: number;
  private newlineRegex = /(\r\n|\r|\n)/g;
  private whitespaceRegex = /\s+/g;
  private lineBreakRegex = /(\r\n|\r|\n)+/g;
  private commentRegex = /\/\*(\*(?!\/)|[^*])*\*\//g;
  private identifierRegex = /[_a-zA-Z][_a-zA-Z0-9]*/g;
  private integerLiteralRegex = /(0|[1-9][0-9]*|0[oO]?[0-7]+|0[xX][0-9a-fA-F]+|0[bB][01]+)[lL]?/g;
  private floatingPointerLiteralRegex = /[+-]?([0-9]*[.])?[0-9]+/g;
  private stringLiteralRegex = /\"(([^\"]|\\\")*[^\\])?\"/g;
  private booleanLiteralRegex = /(true|false)/g;
  private nilLiteralRegex = /nil/g;
  private operatorRegex = /[=-+!*%<>&|^~?]+/g;
  private dotOperatorRegex = /\./g;
  private leftParenthesisRegex = /\(/g;
  private rightParenthesisRegex = /\)/g;
  private leftSquareBracketRegex = /\[/g;
  private rightSquareBracketRegex = /\]/g;
  private leftCurlyBracketRegex = /\{/g;
  private rightCurlyBracketRegex = /\}/g;
  private commaRegex = /\,/g;
  private colonRegex = /\,/g;
  private semicolonRegex = /\;/g;
  private assignmentRegex = /=/g;
  private atRegex = /@/g;
  private numberSignRegex = /#/g;
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
  public eof(): boolean {
    return this.sourceStringOffset >= this.sourceString.length;
  }

  private regex(regex: RegExp): string | undefined {
    regex.lastIndex = this.sourceStringOffset;
    const result = regex.exec(this.sourceString);
    if (result === null) {
      return undefined;
    }
    if (result.index !== 0) {
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
  private getCurrentLocation(): SourceLocation {
    return new SourceLocation(this.sourcePath, this.sourceStringOffset, this.line, this.column);
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
  private advance(str: string) {
    this.sourceStringOffset += str.length;
    this.newlineRegex.lastIndex = 0;
    let lastMatchEnd = 0;
    let result;
    result = this.newlineRegex.exec(str);
    while (result) {
      this.line++;
      lastMatchEnd = result.index + result[0].length;
      result = this.newlineRegex.exec(str);
    }
    this.column = str.length - lastMatchEnd;
    return;
  }

}
