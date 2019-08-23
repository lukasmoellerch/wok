import { ASTWalker } from "../AST/ASTWalker";
import { Block } from "../AST/Nodes/Block";
import { SourceFile } from "../AST/Nodes/SourceFile";
import { IType } from "../Type/Type";
import { TypeExpressionWrapper } from "../Type/UnresolvedType/TypeExpressionWrapper";

class TypeArgument {
  public restrictions: void = undefined;
}
export class TypeScopeEntry {
  public name: string;
  public declaration: undefined;
  public nestedScope: TypeScope;
  public type: IType;
  constructor(name: string, type: IType, declaration: undefined) {
    this.name = name;
    this.declaration = declaration;
    this.nestedScope = new TypeScope();
    this.type = type;
  }
}
export class TypeScope {
  public entries: Map<string, TypeScopeEntry> = new Map();
  public parent: TypeScope | undefined;
  constructor(parent?: TypeScope | undefined) {
    this.parent = parent;
  }
  public addEntry(entry: TypeScopeEntry) {
    this.entries.set(entry.name, entry);
  }
  public resolve(name: string): TypeScopeEntry | undefined {
    const entry = this.entries.get(name);
    if (entry !== undefined) {
      return entry;
    }
    if (this.parent !== undefined) {
      return this.parent.resolve(name);
    }
    return undefined;
  }
}
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
