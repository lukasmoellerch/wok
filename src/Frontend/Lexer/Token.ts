import { ASTNode } from "../AST/ASTNode";
import { TokenContentAttribute } from "../AST/Attributes/TokenContentAttribute";
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

  placeholder,
}
export class Token extends ASTNode {
  public tag: TokenTag;
  public content: string;
  public range: SourceRange;
  constructor(tag: TokenTag, content: string, range: SourceRange) {
    super();
    this.tag = tag;
    this.content = content;
    this.range = range;
    this.setAttribute(new TokenContentAttribute(this));
  }
}
