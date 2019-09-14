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
    return new TypeReferenceExpression(nameToken, []);
  }
}

