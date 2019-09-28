import { SourceLocation } from "./SourceLocation";
import { SourceRange } from "./SourceRange";
import { Token } from "./Token";
import { TokenTag } from "./TokenTag";

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
  public line: number;
  public column: number;
  protected nonCommentWitespaceRegex = /([ \t]+)/g;
  protected whitespaceRegex = /([ \t]+|\/\*(\*(?!\/)|[^*])*\*\/|\/\/(.*)(\r\n|\r|\n))+/g;
  protected sourceStringOffset: number;
  protected sourcePath: string;
  protected newlineRegex = /(\r\n|\r|\n)/g;
  protected nonCommentLineBreakRegex = /(\r\n|\r|\n)+/g;
  protected lineBreakRegex = /((\r\n|\r|\n)([ \t]+|\/\*(\*(?!\/)|[^*])*\*\/|\/\/(.*)(\r\n|\r|\n))*)+/g;
  protected commentRegex = /(\/\*(\*(?!\/)|[^*])*\*\/|\/\/(.*)(\r\n|\r|\n))+/g;
  protected identifierRegex = /[_a-zA-Z][_a-zA-Z0-9]*/g;
  protected integerLiteralRegex = /(0|[1-9][0-9]*|0[oO]?[0-7]+|0[xX][0-9a-fA-F]+|0[bB][01]+)[lL]?/g;
  protected floatingPointerLiteralRegex = /[+-]?([0-9]*[.])?[0-9]+/g;
  protected stringLiteralRegex = /\"(([^\"]|\\\")*[^\\])?\"/g;
  protected booleanLiteralRegex = /(true|false)/g;
  protected nilLiteralRegex = /nil/g;
  protected operatorRegex = /[=+!*%<>&|^~?-]+/g;
  protected dotOperatorRegex = /\./g;
  protected leftParenthesisRegex = /\(/g;
  protected rightParenthesisRegex = /\)/g;
  protected leftSquareBracketRegex = /\[/g;
  protected rightSquareBracketRegex = /\]/g;
  protected leftCurlyBracketRegex = /\{/g;
  protected rightCurlyBracketRegex = /\}/g;
  protected commaRegex = /\,/g;
  protected colonRegex = /\:/g;
  protected semicolonRegex = /\;/g;
  protected assignmentRegex = /=/g;
  protected atRegex = /@/g;
  protected numberSignRegex = /#/g;
  private tokenizationMethods: Array<[TokenTag, (() => Token | undefined)]> = [
    [TokenTag.whitespace, this.nonCommentWhitespace],
    [TokenTag.lineBreak, this.nonCommentLineBreak],
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
    [TokenTag.rightCurlyBracket, this.rightCurlyBracket],
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
    [TokenTag.rightCurlyBracket, TokenTagGroup.punctuation],
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
  private keywords = ["func", "operator", "prefix", "infix", "postfix", "var", "let", "while", "if", "return", "self"];
  constructor(sourcePath: string, sourceString: string) {
    this.sourcePath = sourcePath;
    this.sourceString = sourceString;
    this.sourceStringOffset = 0;
    this.line = 1;
    this.column = 1;
  }
  public nonCommentWhitespace(advance: boolean = true): Token | undefined {
    return this.regexReturnToken(advance, TokenTag.whitespace, this.nonCommentWitespaceRegex);
  }
  public whitespace(advance: boolean = true): Token | undefined {
    return this.regexReturnToken(advance, TokenTag.whitespace, this.whitespaceRegex);
  }
  public nonCommentLineBreak(advance: boolean = true): Token | undefined {
    return this.regexReturnToken(advance, TokenTag.whitespace, this.nonCommentLineBreakRegex);
  }
  public lineBreak(advance: boolean = true): Token | undefined {
    return this.regexReturnToken(advance, TokenTag.lineBreak, this.lineBreakRegex);
  }
  public comment(advance: boolean = true): Token | undefined {
    return this.regexReturnToken(advance, TokenTag.comment, this.commentRegex);
  }
  public identifier(advance: boolean = true): Token | undefined {
    return this.regexReturnToken(advance, TokenTag.identifier, this.identifierRegex);
  }
  public integerLiteral(advance: boolean = true): Token | undefined {
    return this.regexReturnToken(advance, TokenTag.integerLiteral, this.integerLiteralRegex);
  }
  public floatingPointLiteral(advance: boolean = true): Token | undefined {
    return this.regexReturnToken(advance, TokenTag.floatingPointLiteral, this.floatingPointerLiteralRegex);
  }
  public stringLiteral(advance: boolean = true): Token | undefined {
    return this.regexReturnToken(advance, TokenTag.stringLiteral, this.stringLiteralRegex);
  }
  public booleanLiteral(advance: boolean = true): Token | undefined {
    return this.regexReturnToken(advance, TokenTag.booleanLiteral, this.booleanLiteralRegex);
  }
  public nilLiteral(advance: boolean = true): Token | undefined {
    return this.regexReturnToken(advance, TokenTag.nilLiteral, this.nilLiteralRegex);
  }
  public operator(advance: boolean = true): Token | undefined {
    return this.regexReturnToken(advance, TokenTag.operator, this.operatorRegex);
  }
  public dotOperator(advance: boolean = true): Token | undefined {
    return this.regexReturnToken(advance, TokenTag.dotOperator, this.dotOperatorRegex);
  }
  public leftParenthesis(advance: boolean = true): Token | undefined {
    return this.regexReturnToken(advance, TokenTag.dotOperator, this.leftParenthesisRegex);
  }
  public rightParenthesis(advance: boolean = true): Token | undefined {
    return this.regexReturnToken(advance, TokenTag.dotOperator, this.rightParenthesisRegex);
  }
  public leftSquareBracket(advance: boolean = true): Token | undefined {
    return this.regexReturnToken(advance, TokenTag.dotOperator, this.leftSquareBracketRegex);
  }
  public rightSquareBracket(advance: boolean = true): Token | undefined {
    return this.regexReturnToken(advance, TokenTag.dotOperator, this.rightSquareBracketRegex);
  }
  public leftCurlyBracket(advance: boolean = true): Token | undefined {
    return this.regexReturnToken(advance, TokenTag.dotOperator, this.leftCurlyBracketRegex);
  }
  public rightCurlyBracket(advance: boolean = true): Token | undefined {
    return this.regexReturnToken(advance, TokenTag.dotOperator, this.rightCurlyBracketRegex);
  }
  public comma(advance: boolean = true): Token | undefined {
    return this.regexReturnToken(advance, TokenTag.dotOperator, this.commaRegex);
  }
  public colon(advance: boolean = true): Token | undefined {
    return this.regexReturnToken(advance, TokenTag.dotOperator, this.colonRegex);
  }
  public semicolon(advance: boolean = true): Token | undefined {
    return this.regexReturnToken(advance, TokenTag.dotOperator, this.semicolonRegex);
  }
  public assignment(advance: boolean = true): Token | undefined {
    const a = this.operator(false);
    if (a === undefined) {
      return undefined;
    } else {
      if (a.content !== "=") {
        return undefined;
      }
    }
    if (!advance) {
      return a;
    }
    return this.operator();
  }
  public at(advance: boolean = true): Token | undefined {
    return this.regexReturnToken(advance, TokenTag.dotOperator, this.atRegex);
  }
  public numberSign(advance: boolean = true): Token | undefined {
    return this.regexReturnToken(advance, TokenTag.dotOperator, this.numberSignRegex);
  }
  public errorAdvance() {
    this.advance(this.sourceString[this.sourceStringOffset]);
  }
  public keyword(str: string, advance: boolean = true): Token | undefined {
    const start = this.getCurrentLocation();
    const result = this.regex(this.identifierRegex);
    if (result === undefined) {
      return undefined;
    }
    if (result !== str) {
      return undefined;
    }
    if (advance) {
      this.advance(result);
    }
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
  public nextToken(): Token | undefined {
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
  private regexAndAdvance(advance: boolean, regex: RegExp): string | undefined {
    const result = this.regex(regex);
    if (result === undefined) {
      return undefined;
    }
    if (advance) {
      this.advance(result);
    }
    return result;
  }
  private regexReturnToken(advance: boolean, tag: TokenTag, regex: RegExp): Token | undefined {
    const start = this.getCurrentLocation();
    const content = this.regexAndAdvance(advance, regex);
    if (content === undefined) {
      return undefined;
    }
    const end = this.getCurrentLocation();
    const range = new SourceRange(start, end);
    const token = new Token(tag, content, range);
    return token;
  }

}
