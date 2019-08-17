import { SourceRange } from "../Lexer/SourceRange";
import { TokenTag } from "../Lexer/Token";

export class ParserError {
  constructor(public range: SourceRange) { }
  public toString(): string {
    return "unknown error";
  }
}
export class WrongTokenError extends ParserError {
  constructor(range: SourceRange, public expected: Array<TokenTag | string>) {
    super(range);
  }
  public tokenTagString(tokenTag: TokenTag): string {
    switch (tokenTag) {
      case TokenTag.whitespace:
        return "Whitespace";
      case TokenTag.lineBreak:
        return "Line Break (\\n, \\r or \\r\\n)";
      case TokenTag.comment:
        return "Comment (/* ... */)";
      case TokenTag.identifier:
        return "Identifier ([_a-zA-Z][_a-zA-Z0-9]*)";
      case TokenTag.integerLiteral:
        return "Integer Literal (0123456789)";
      case TokenTag.floatingPointLiteral:
        return "FloatinPointLiteral (0.1234)";
      case TokenTag.stringLiteral:
        return "StringLiteral (\"Hello World\")";
      case TokenTag.booleanLiteral:
        return "Boolean (true or false)";
      case TokenTag.nilLiteral:
        return "Nil Literal (nil)";
      case TokenTag.operator:
        return "Operator";
      case TokenTag.dotOperator:
        return "Dot Operator (-)";
      case TokenTag.leftParenthesis:
        return "Left Parenthesis (()";
      case TokenTag.rightParenthesis:
        return "Right Parenthesis ())";
      case TokenTag.leftSquareBracket:
        return "Left Square Bracket ([)";
      case TokenTag.rightSquareBracket:
        return "Right Square Bracket (])";
      case TokenTag.leftCurlyBracket:
        return "Left Curly Bracket ({)";
      case TokenTag.rightCurlyBracket:
        return "Right Curly Bracket (})";
      case TokenTag.comma:
        return "Comma (,)";
      case TokenTag.colon:
        return "Colon (:)";
      case TokenTag.semicolon:
        return "Semicolon (;)";
      case TokenTag.assignment:
        return "Assignment (=)";
      case TokenTag.at:
        return "At (@)";
      case TokenTag.numberSign:
        return "Number Sign (#)";
      case TokenTag.keyword:
        return "Keyword";
      case TokenTag.placeholder:
        return "Placeholder";
    }
  }
  public stringifyError(e: TokenTag | string): string {
    if (typeof e === "string") {
      return e;
    }
    return this.tokenTagString(e);
  }
  public toString(): string {
    const firstString = (this.expected.length > 1 ? this.expected.slice(0, this.expected.length - 2).map((e) => this.stringifyError(e)).join(", ") : "");
    const lastString = this.stringifyError(this.expected[this.expected.length - 1]);
    const str = firstString === "" ? lastString : `${firstString} or ${lastString}`;
    return `Expected "${str}" but found "${this.range.sourceContent[this.range.start.offset] || "EOF"}"`;
  }
}