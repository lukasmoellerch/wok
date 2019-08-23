import { ASTWalker } from "../AST/ASTWalker";
import { ParserError, TypeHasNoMemberCalledError, UndeclaredTypeUsageError } from "../Parser/ParserError";
import { IType } from "../Type/Type";
import { TypeExpression } from "../Type/UnresolvedType/TypeExpression";
import { TypeExpressionWrapper } from "../Type/UnresolvedType/TypeExpressionWrapper";
import { TypeMemberExpression } from "../Type/UnresolvedType/TypeMemberExpression";
import { TypeReferenceExpression } from "../Type/UnresolvedType/TypeReferenceExpression";
import { VoidType } from "../Type/VoidType";
import { TypeScope } from "./TypeScopeBuilder";

export class TypeResolver extends ASTWalker {
  public errors: ParserError[];
  constructor(errors: ParserError[]) {
    super();
    this.errors = errors;
  }
  protected walkTypeExpressionWrapper(typeExpressionWrapper: TypeExpressionWrapper) {
    const expression = typeExpressionWrapper.expression;
    const scope = typeExpressionWrapper.typeScope;
    const type = this.resolveTypeExpression(expression, scope);
    typeExpressionWrapper.type = type;
    return typeExpressionWrapper;
  }
  protected resolveTypeExpression(expression: TypeExpression, scope: TypeScope): IType {
    if (expression instanceof TypeReferenceExpression) {
      const name = expression.name.content;
      const entry = scope.resolve(name);
      if (entry === undefined) {
        this.errors.push(new UndeclaredTypeUsageError(expression.name.range, name));
        return new VoidType();
      }
      return entry.type;
    } else if (expression instanceof TypeMemberExpression) {
      const left = this.resolveTypeExpression(expression.lhs, scope);
      const name = expression.member.content;
      const entry = left.scope.resolve(name);
      if (entry === undefined) {
        this.errors.push(new TypeHasNoMemberCalledError(expression.member.range, left.name, name));
        return new VoidType();
      }
    }
    return new VoidType();
  }
}
