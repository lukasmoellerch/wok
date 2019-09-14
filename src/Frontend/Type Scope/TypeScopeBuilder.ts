import { ASTWalker } from "../AST/ASTWalker";
import { Block } from "../AST/Nodes/Block";
import { ExpressionWrapper } from "../AST/Nodes/ExpressionWrapper";
import { SourceFile } from "../AST/Nodes/SourceFile";
import { StructDeclaration } from "../AST/Nodes/StructDeclaration";
import { UnboundFunctionDeclaration } from "../AST/Nodes/UnboundFunctionDeclaration";
import { StructType } from "../Type/StructType";
import { TypeExpressionWrapper } from "../Type/UnresolvedType/TypeExpressionWrapper";
import { ArgumentlessTypeTreeNodeTemplate, TypeTreeNode } from "./TypeScope";

export class TypeScopeBuilder extends ASTWalker {
  public sourceFile: SourceFile;
  public scopes: TypeTreeNode[] = [];
  constructor(sourceFile: SourceFile) {
    super();
    this.sourceFile = sourceFile;
  }
  public populateGlobalTypeScope(globalScope: TypeTreeNode) {
    this.scopes = [globalScope];
    for (const declaration of this.sourceFile.topLevelDeclarations) {
      if (declaration instanceof StructDeclaration) {
        const type = new StructType(declaration.nameToken.content, this.scopes[0], declaration);
        const node = new TypeTreeNode(globalScope, [], declaration.nameToken.content, "struct", type);
        type.node = node;
        const template = new ArgumentlessTypeTreeNodeTemplate(node);
        declaration.template = template;
        globalScope.registerNewNamedTemplate(declaration.nameToken.content, template);
      }
    }
  }
  public buildScopes() {
    this.walkSourceFile(this.sourceFile);
  }
  public walkUnboundFunctionDeclaration(unboundFunctionDeclaration: UnboundFunctionDeclaration) {
    const parent = this.scopes.length > 0 ? this.scopes[this.scopes.length - 1] : undefined;
    const scope = new TypeTreeNode(parent, [], unboundFunctionDeclaration.functionNameToken.content, "function");
    this.scopes.push(scope);
    super.walkUnboundFunctionDeclaration(unboundFunctionDeclaration);
    this.scopes.pop();
  }
  public walkStructDeclaration(structDeclaration: StructDeclaration) {
    const parent = this.scopes.length > 0 ? this.scopes[this.scopes.length - 1] : undefined;
    const template = structDeclaration.template;
    const type = new StructType(structDeclaration.nameToken.content, this.scopes[0], structDeclaration);
    let scope = new TypeTreeNode(parent, [], structDeclaration.nameToken.content, "struct", type);
    type.node = scope;
    if (template !== undefined) {
      scope = template.create([]);
      type.node = scope;
    }
    this.scopes.push(scope);
    super.walkStructDeclaration(structDeclaration);
    this.scopes.pop();
  }
  public walkBlock(block: Block) {
    const parent = this.scopes.length > 0 ? this.scopes[this.scopes.length - 1] : undefined;
    const scope = new TypeTreeNode(parent, [], "block", "block");
    this.scopes.push(scope);
    super.walkBlock(block);
    this.scopes.pop();
  }
  protected walkTypeExpressionWrapper(typeExpressionWrapper: TypeExpressionWrapper) {
    super.walkTypeExpressionWrapper(typeExpressionWrapper);
    typeExpressionWrapper.wrappingTypeTreeNode = this.scopes[this.scopes.length - 1];
  }
  protected walkExpressionWrapper(expressionWrapper: ExpressionWrapper) {
    super.walkExpressionWrapper(expressionWrapper);
    expressionWrapper.wrappingTypeTreeNode = this.scopes[this.scopes.length - 1];
  }
}
