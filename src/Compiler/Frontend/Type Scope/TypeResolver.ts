import { ASTWalker } from "../AST/ASTWalker";
import { UnboundFunctionDeclaration } from "../AST/Nodes/UnboundFunctionDeclaration";
import { CompilerError, TypeHasNoMemberCalledError, UndeclaredTypeUsageError } from "../ErrorHandling/CompilerError";
import { IType } from "../Type/Type";
import { TypeExpression } from "../Type/UnresolvedType/TypeExpression";
import { TypeExpressionWrapper } from "../Type/UnresolvedType/TypeExpressionWrapper";
import { TypeMemberExpression } from "../Type/UnresolvedType/TypeMemberExpression";
import { TypeReferenceExpression } from "../Type/UnresolvedType/TypeReferenceExpression";
import { TypeTreeNode } from "./TypeScope";

export class TypeResolver extends ASTWalker {
  public errors: CompilerError[];
  constructor(private rootTypeTreeNode: TypeTreeNode, errors: CompilerError[]) {
    super();
    this.errors = errors;
  }
  public resolveTypeExpression(expression: TypeExpression, node: TypeTreeNode): IType {
    const q = this.resolveTypeExpressionToNode(expression, node);
    if (q === undefined) {
      throw new Error();
    }
    const type = q.type;
    if (type === undefined) {
      throw new Error();
    }
    return type;
  }
  public resolveTypeExpressionToNode(expression: TypeExpression, node: TypeTreeNode): TypeTreeNode | undefined {
    if (expression instanceof TypeReferenceExpression) {
      const name = expression.name.content;
      const args: TypeTreeNode[] = [];
      for (const parameter of expression.parameters) {
        const parameterNode = this.resolveTypeExpressionToNode(parameter, node);
        if (parameterNode === undefined) {
          throw new Error();
        }
        args.push(parameterNode);
      }
      const entry = node.resolve(name, args);
      if (entry === undefined) {
        this.errors.push(new UndeclaredTypeUsageError(expression.name.range, name));
        return undefined;
      }
      return entry;
    } else if (expression instanceof TypeMemberExpression) {
      const left = this.resolveTypeExpression(expression.lhs, node);
      const name = expression.member.content;
      const entry = left.node.resolve(name, []);
      if (entry === undefined) {
        this.errors.push(new TypeHasNoMemberCalledError(expression.member.range, left.name, name));
        return undefined;
      }
      return entry;
    }
    return undefined;
  }
  protected walkTypeExpressionWrapper(typeExpressionWrapper: TypeExpressionWrapper) {
    const expression = typeExpressionWrapper.expression;
    const scope = typeExpressionWrapper.wrappingTypeTreeNode;
    if (scope === undefined) {
      throw new Error();
    }
    const type = this.resolveTypeExpression(expression, scope);
    typeExpressionWrapper.type = type;
    return typeExpressionWrapper;
  }
  protected walkUnboundFunctionDeclaration(unboundFunctionDeclaration: UnboundFunctionDeclaration) {
    super.walkUnboundFunctionDeclaration(unboundFunctionDeclaration);
    const entry = unboundFunctionDeclaration.entry;
    if (entry === undefined) {
      throw new Error();
    }
    entry.type = unboundFunctionDeclaration.getFunctionType(this.rootTypeTreeNode);
  }
}
