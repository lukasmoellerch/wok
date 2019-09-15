import { CompilerError, WrongTokenError } from "../ErrorHandling/CompilerError";
import { Lexer } from "../Lexer/Lexer";
import { PlaceholderToken } from "../Lexer/PlaceholderToken";
import { TokenTag } from "../Lexer/TokenTag";
import { TypeExpression } from "../Type/UnresolvedType/TypeExpression";
import { TypeReferenceExpression } from "../Type/UnresolvedType/TypeReferenceExpression";

export class TypeParser {
  public errors: CompilerError[];
  constructor(private lexer: Lexer, errors: CompilerError[]) {
    this.errors = errors;
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
    const less = this.lexer.character("<");
    if (less !== undefined) {
      let greater = this.lexer.character(">") || new PlaceholderToken(this.lexer);
      let first = true;
      const args: TypeExpression[] = [];
      while (greater instanceof PlaceholderToken && !this.lexer.eof()) {
        if (!first) {
          this.lexer.whitespace();
          this.lexer.comma();
        } else {
          first = false;
        }
        this.lexer.whitespace();
        const arg = this.parseType();
        args.push(arg);
        this.lexer.whitespace();
        greater = this.lexer.character(">") || new PlaceholderToken(this.lexer);
      }
      if (this.lexer.eof()) {
        // TODO: Handle Error
        throw new Error();
      }
      return new TypeReferenceExpression(nameToken, args);
    } else {
      return new TypeReferenceExpression(nameToken, []);
    }
  }
}

