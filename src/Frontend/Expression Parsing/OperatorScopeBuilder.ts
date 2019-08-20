import { Block } from "../AST/Nodes/Block";
import { ExpressionWrapper } from "../AST/Nodes/ExpressionWrapper";
import { IfStatement } from "../AST/Nodes/IfStatement";
import { InfixOperatorDeclaration } from "../AST/Nodes/InfixOperatorDeclaration";
import { PostfixOperatorDeclaration } from "../AST/Nodes/PostfixOperatorDeclaration";
import { PrefixOperatorDeclaration } from "../AST/Nodes/PrefixOperatorDeclaration";
import { SourceFile } from "../AST/Nodes/SourceFile";
import { UnboundFunctionDeclaration } from "../AST/Nodes/UnboundFunctionDeclaration";
import { WhileStatement } from "../AST/Nodes/WhileStatement";
import { DuplicateInfixGlobalOperator, DuplicatePostfixGlobalOperator, DuplicatePrefixGlobalOperator, ParserError } from "../Parser/ParserError";

class PrefixOperatorEntry {
  public str: string;
  public declaration: PrefixOperatorDeclaration;
  constructor(str: string, declaration: PrefixOperatorDeclaration) {
    this.str = str;
    this.declaration = declaration;
  }
}
class InfixOperatorEntry {
  public str: string;
  public declaration: InfixOperatorDeclaration;
  constructor(str: string, declaration: InfixOperatorDeclaration) {
    this.str = str;
    this.declaration = declaration;
  }
}
class PostfixOperatorEntry {
  public str: string;
  public declaration: PostfixOperatorDeclaration;
  constructor(str: string, declaration: PostfixOperatorDeclaration) {
    this.str = str;
    this.declaration = declaration;
  }
}
export class OperatorScope {
  public prefixOperators: Map<string, PrefixOperatorEntry> = new Map();
  public postfixOperators: Map<string, InfixOperatorEntry | PostfixOperatorEntry> = new Map();
  public parent: OperatorScope | undefined;
  constructor(parent?: OperatorScope | undefined) {
    this.parent = parent;
  }
  public resolvePrefix(str: string): PrefixOperatorEntry | undefined {
    const entry = this.prefixOperators.get(str);
    if (entry !== undefined) {
      return entry;
    }
    if (this.parent !== undefined) {
      return this.parent.resolvePrefix(str);
    }
    return undefined;
  }
  public hasPrefixOperator(str: string): boolean {
    return this.prefixOperators.has(str);
  }
  public resolvePostfix(str: string): InfixOperatorEntry | PostfixOperatorEntry | undefined {
    const entry = this.postfixOperators.get(str);
    if (entry !== undefined) {
      return entry;
    }
    if (this.parent !== undefined) {
      return this.parent.resolvePostfix(str);
    }
    return undefined;
  }
  public hasPostfixOperator(str: string): boolean {
    return this.postfixOperators.has(str);
  }
  public register(entry: PrefixOperatorEntry | InfixOperatorEntry | PostfixOperatorEntry) {
    if (entry instanceof PrefixOperatorEntry) {
      this.prefixOperators.set(entry.str, entry);
    } else {
      this.postfixOperators.set(entry.str, entry);
    }
  }
}
export class OperatorScopeBuilder {
  public sourceFile: SourceFile;
  public scopes: OperatorScope[] = [];
  public errors: ParserError[] = [];
  constructor(sourceFile: SourceFile, errorBuffer: ParserError[]) {
    this.sourceFile = sourceFile;
    this.errors = errorBuffer;
  }
  public populateGlobalOperatorScope(globalScope: OperatorScope) {
    this.scopes = [globalScope];
    for (const declaration of this.sourceFile.topLevelDeclarations) {
      if (declaration instanceof InfixOperatorDeclaration) {
        const has = globalScope.hasPostfixOperator(declaration.operatorToken.content);
        if (has) {
          this.errors.push(new DuplicateInfixGlobalOperator(declaration.operatorToken.range, declaration));
        } else {
          const entry = new InfixOperatorEntry(declaration.operatorToken.content, declaration);
          globalScope.register(entry);
        }
      }

      if (declaration instanceof PostfixOperatorDeclaration) {
        const has = globalScope.hasPostfixOperator(declaration.operatorToken.content);
        if (has) {
          this.errors.push(new DuplicatePostfixGlobalOperator(declaration.operatorToken.range, declaration));
        } else {
          const entry = new PostfixOperatorEntry(declaration.operatorToken.content, declaration);
          globalScope.register(entry);
        }
      }

      if (declaration instanceof PrefixOperatorDeclaration) {
        const has = globalScope.hasPrefixOperator(declaration.operatorToken.content);
        if (has) {
          this.errors.push(new DuplicatePrefixGlobalOperator(declaration.operatorToken.range, declaration));
        } else {
          const entry = new PrefixOperatorEntry(declaration.operatorToken.content, declaration);
          globalScope.register(entry);
        }
      }
    }
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
    const scope = new OperatorScope(parent);
    this.scopes.push(scope);
    for (const statement of block.statements) {
      if (statement instanceof IfStatement) {
        this.traverseBlock(statement.block);
      }
      if (statement instanceof WhileStatement) {
        this.traverseBlock(statement.block);
      }
      if (statement instanceof ExpressionWrapper) {
        statement.operatorScope = scope;
      }
    }
    this.scopes.pop();
  }
}
