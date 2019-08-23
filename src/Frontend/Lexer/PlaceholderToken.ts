import { Lexer } from "./Lexer";
import { SourceRange } from "./SourceRange";
import { Token } from "./Token";
import { TokenTag } from "./TokenTag";
export class PlaceholderToken extends Token {
  constructor(lexer: Lexer) {
    const start = lexer.getCurrentLocation();
    const end = lexer.getCurrentLocation();
    const range = new SourceRange(start, end);
    super(TokenTag.placeholder, "", range);
  }
}
