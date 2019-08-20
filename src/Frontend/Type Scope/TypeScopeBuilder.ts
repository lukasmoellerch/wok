import { Block } from "../AST/Nodes/Block";
import { ExpressionWrapper } from "../AST/Nodes/ExpressionWrapper";
import { IfStatement } from "../AST/Nodes/IfStatement";
import { SourceFile } from "../AST/Nodes/SourceFile";
import { UnboundFunctionDeclaration } from "../AST/Nodes/UnboundFunctionDeclaration";
import { WhileStatement } from "../AST/Nodes/WhileStatement";

class TypeArgument {
  public restrictions: void = undefined;
}
class TypeScopeEntry {
  public name: string;
  public arguments: TypeArgument[];
  public declaration: undefined;
  public nestedScope: TypeScope;
  constructor(name: string, args: TypeArgument[], declaration: undefined) {
    this.name = name;
    this.arguments = args;
    this.declaration = declaration;
    this.nestedScope = new TypeScope();
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
export class TypeScopeBuilder {
  public sourceFile: SourceFile;
  public scopes: TypeScope[] = [];
  constructor(sourceFile: SourceFile) {
    this.sourceFile = sourceFile;
  }
  public populateGlobalTypeScope(globalScope: TypeScope) {
    this.scopes = [globalScope];
    for (const declaration of this.sourceFile.topLevelDeclarations) {
      return;
    }
    globalScope.resolve("test");
  }
  public buildScopes() {
    for (const topLevelDeclaration of this.sourceFile.topLevelDeclarations) {
      if (topLevelDeclaration instanceof UnboundFunctionDeclaration) {
        this.traverseBlock(topLevelDeclaration.block);
      }
    }
  }
  public traverseBlock(block: Block) {
    const parent = this.scopes.length > 0 ? this.scopes[this.scopes.length - 1] : undefined;
    const scope = new TypeScope(parent);
    this.scopes.push(scope);
    for (const statement of block.statements) {
      if (statement instanceof IfStatement) {
        this.traverseBlock(statement.block);
      }
      if (statement instanceof WhileStatement) {
        this.traverseBlock(statement.block);
      }
      if (statement instanceof ExpressionWrapper) {
        statement.typeScope = scope;
      }
    }
    this.scopes.pop();
  }
}
