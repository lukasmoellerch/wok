import { MethodDeclaration } from "../AST/Nodes/MethodDeclaration";
import { TypeExpressionWrapper } from "../Type/UnresolvedType/TypeExpressionWrapper";
export class Extension {
  public targetTypeExpression: TypeExpressionWrapper;
  public methodMap: Map<string, MethodDeclaration>;
  constructor(targetTypeExpression: TypeExpressionWrapper) {
    this.targetTypeExpression = targetTypeExpression;
    this.methodMap = new Map();
  }
  public addMethod(name: string, declaration: MethodDeclaration) {
    this.methodMap.set(name, declaration);
  }
}
