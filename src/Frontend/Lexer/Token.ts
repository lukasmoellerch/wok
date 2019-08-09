import { SourceRange } from "./SourceRange";
export enum TokenTag {
  whitespace,
  lineBreak,
  comment,
  identifier,
  integerLiteral,
  floatingPointLiteral,
  stringLiteral,
  booleanLiteral,
  nilLiteral,
  operator,
  dotOperator,
  leftParenthesis,
  rightParenthesis,
  leftSquareBracket,
  rightSquareBracket,
  leftCurlyBracket,
  rightCurlyBracket,
  comma,
  colon,
  semicolon,
  assignment,
  at,
  numberSign,
  keyword,
}
export class Token {
  public tag: TokenTag;
  public content: string;
  public range: SourceRange;
  constructor(tag: TokenTag, content: string, range: SourceRange) {
    this.tag = tag;
    this.content = content;
    this.range = range;
  }
}
