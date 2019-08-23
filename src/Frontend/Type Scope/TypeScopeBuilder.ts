import { ASTWalker } from "../AST/ASTWalker";
import { Block } from "../AST/Nodes/Block";
import { SourceFile } from "../AST/Nodes/SourceFile";
import { TypeExpressionWrapper } from "../Type/UnresolvedType/TypeExpressionWrapper";
import { TypeScope } from "./TypeScope";

export class TypeScopeBuilder extends ASTWalker {
  public sourceFile: SourceFile;
  public scopes: TypeScope[] = [];
  constructor(sourceFile: SourceFile) {
    super();
    this.sourceFile = sourceFile;
  }
  public populateGlobalTypeScope(globalScope: TypeScope) {
    this.scopes = [globalScope];
    for (const declaration of this.sourceFile.topLevelDeclarations) {
      return;
    }
  }
  public buildScopes() {
    this.walkSourceFile(this.sourceFile);
  }
  public walkBlock(block: Block) {
    const parent = this.scopes.length > 0 ? this.scopes[this.scopes.length - 1] : undefined;
    const scope = new TypeScope(parent);
    this.scopes.push(scope);
    super.walkBlock(block);
    this.scopes.pop();
  }
  protected walkTypeExpressionWrapper(typeExpressionWrapper: TypeExpressionWrapper) {
    typeExpressionWrapper.typeScope = this.scopes[this.scopes.length - 1];
    return typeExpressionWrapper;
  }
}
