import { ASTWalker } from "../AST/ASTWalker";
import { Block } from "../AST/Nodes/Block";
import { ConstantDeclaration } from "../AST/Nodes/ConstantDeclaration";
import { FunctionArgumentDeclaration } from "../AST/Nodes/FunctionArgumentDeclaration";
import { MethodDeclaration } from "../AST/Nodes/MethodDeclaration";
import { SourceFile } from "../AST/Nodes/SourceFile";
import { StructDeclaration } from "../AST/Nodes/StructDeclaration";
import { UnboundFunctionDeclaration } from "../AST/Nodes/UnboundFunctionDeclaration";
import { VariableDeclaration } from "../AST/Nodes/VariableDeclaration";
import { VariableReferenceExpression } from "../AST/Nodes/VariableReferenceExpression";
import { CompilerError, UndeclaredVariableUsageError } from "../ErrorHandling/CompilerError";
import { TypeTreeNode } from "../Type Scope/TypeScope";
import { VariableScope, VariableScopeEntry, VariableScopeEntryType } from "./VariableScope";
export type FunctionDeclaration = UnboundFunctionDeclaration | MethodDeclaration;
export class VariableScopeBuilder extends ASTWalker {
  public sourceFile: SourceFile;
  public scopes: VariableScope[] = [];
  public errors: CompilerError[];
  public functionCompilationStack: FunctionDeclaration[] = [];
  public selfStack: VariableScopeEntry[] = [];
  constructor(private rootTypeTreeNode: TypeTreeNode, sourceFile: SourceFile, errorBuffer: CompilerError[]) {
    super();
    this.sourceFile = sourceFile;
    this.errors = errorBuffer;
  }
  public populateGlobalVariableScope(globalScope: VariableScope) {
    this.scopes = [globalScope];
    for (const declaration of this.sourceFile.topLevelDeclarations) {
      if (declaration instanceof UnboundFunctionDeclaration) {
        const str = declaration.name.content;
        const entryType = VariableScopeEntryType.globalUnboundFunction;
        const type = declaration.getFunctionType(this.rootTypeTreeNode);
        const entry = new VariableScopeEntry(str, entryType, declaration, type);
        declaration.entry = entry;
        globalScope.register(entry);
      }
    }
  }
  public buildScopes() {
    this.walkSourceFile(this.sourceFile);
  }
  public walkUnboundFunctionDeclaration(unboundFunctionDeclaration: UnboundFunctionDeclaration) {
    this.functionCompilationStack.push(unboundFunctionDeclaration);
    super.walkUnboundFunctionDeclaration(unboundFunctionDeclaration);
  }
  public walkMethodDeclaration(methodDeclaration: MethodDeclaration) {
    this.functionCompilationStack.push(methodDeclaration);
    methodDeclaration.variables.push(this.selfStack[this.selfStack.length - 1]);

    const parent = this.scopes.length > 0 ? this.scopes[this.scopes.length - 1] : undefined;
    const scope = new VariableScope(parent);
    this.scopes.push(scope);
    this.scopes[this.scopes.length - 1].register(this.selfStack[this.selfStack.length - 1]);
    methodDeclaration.thisEntry = this.selfStack[this.selfStack.length - 1];
    super.walkMethodDeclaration(methodDeclaration);
    this.scopes.pop();
  }
  public walkBlock(block: Block) {
    const parent = this.scopes.length > 0 ? this.scopes[this.scopes.length - 1] : undefined;
    const scope = new VariableScope(parent);
    this.scopes.push(scope);
    super.walkBlock(block);
    this.scopes.pop();
  }
  public walkVariableDeclaration(variableDeclaration: VariableDeclaration) {
    const str = variableDeclaration.identifierToken.content;
    const entryType = VariableScopeEntryType.variable;
    const type = variableDeclaration.typeHint;
    const entry = new VariableScopeEntry(str, entryType, variableDeclaration, type !== undefined ? type.type : undefined);
    this.scopes[this.scopes.length - 1].register(entry);
    variableDeclaration.entry = entry;
    this.functionCompilationStack[this.functionCompilationStack.length - 1].variables.push(entry);
    super.walkVariableDeclaration(variableDeclaration);
  }
  public walkConstantDeclaration(constantDeclaration: ConstantDeclaration) {
    const str = constantDeclaration.identifierToken.content;
    const entryType = VariableScopeEntryType.constant;
    const type = constantDeclaration.typeHint;
    const entry = new VariableScopeEntry(str, entryType, constantDeclaration, type !== undefined ? type.type : undefined);
    this.scopes[this.scopes.length - 1].register(entry);
    constantDeclaration.entry = entry;
    this.functionCompilationStack[this.functionCompilationStack.length - 1].variables.push(entry);
    super.walkConstantDeclaration(constantDeclaration);
  }
  public walkArgumentDeclaration(argumentDeclaration: FunctionArgumentDeclaration) {
    const str = argumentDeclaration.name.content;
    const entryType = VariableScopeEntryType.argument;
    const type = argumentDeclaration.type;
    const entry = new VariableScopeEntry(str, entryType, argumentDeclaration, type.type);
    this.scopes[this.scopes.length - 1].register(entry);
    argumentDeclaration.entry = entry;
    this.functionCompilationStack[this.functionCompilationStack.length - 1].variables.push(entry);
    return super.walkArgumentDeclaration(argumentDeclaration);
  }
  public walkVariableReferenceExpression(variableReferenceExpression: VariableReferenceExpression) {
    const scope = this.scopes[this.scopes.length - 1];
    const str = variableReferenceExpression.variableToken.content;
    const entry = scope.resolve(str);
    if (entry === undefined) {
      this.errors.push(new UndeclaredVariableUsageError(variableReferenceExpression.variableToken.range, str));
      return super.walkVariableReferenceExpression(variableReferenceExpression);
    }
    variableReferenceExpression.resolveToEntry(entry);
    return super.walkVariableReferenceExpression(variableReferenceExpression);
  }
  public walkStructDeclaration(structDeclaration: StructDeclaration) {
    const str = "self";
    const entryType = VariableScopeEntryType.self;
    const type = structDeclaration.typeCheckingType;
    if (type === undefined) {
      throw new Error();
    }
    const entry = new VariableScopeEntry(str, entryType, structDeclaration, type);
    this.selfStack.push(entry);
    super.walkStructDeclaration(structDeclaration);
  }
}
