import { ASTWalker } from "../AST/ASTWalker";
import { Block } from "../AST/Nodes/Block";
import { ExpressionWrapper } from "../AST/Nodes/ExpressionWrapper";
import { InfixOperatorDeclaration } from "../AST/Nodes/InfixOperatorDeclaration";
import { PostfixOperatorDeclaration } from "../AST/Nodes/PostfixOperatorDeclaration";
import { PrefixOperatorDeclaration } from "../AST/Nodes/PrefixOperatorDeclaration";
import { SourceFile } from "../AST/Nodes/SourceFile";
import { CompilerError, DuplicateInfixGlobalOperator, DuplicatePostfixGlobalOperator, DuplicatePrefixGlobalOperator } from "../ErrorHandling/CompilerError";
import { InfixOperatorEntry, OperatorScope, PostfixOperatorEntry, PrefixOperatorEntry } from "./OperatorScope";
export class OperatorScopeBuilder extends ASTWalker {
  public sourceFile: SourceFile;
  public scopes: OperatorScope[] = [];
  public errors: CompilerError[] = [];
  constructor(sourceFile: SourceFile, errorBuffer: CompilerError[]) {
    super();
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
    this.walkSourceFile(this.sourceFile);
  }
  public walkBlock(block: Block) {
    const parent = this.scopes.length > 0 ? this.scopes[this.scopes.length - 1] : undefined;
    const scope = new OperatorScope(parent);
    this.scopes.push(scope);
    super.walkBlock(block);
    this.scopes.pop();
  }
  protected walkExpressionWrapper(expressionWrapper: ExpressionWrapper) {
    expressionWrapper.operatorScope = this.scopes[this.scopes.length - 1];
    super.walkExpressionWrapper(expressionWrapper);
  }
}
