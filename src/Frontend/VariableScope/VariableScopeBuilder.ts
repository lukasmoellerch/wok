import { ASTWalker } from "../AST/ASTWalker";
import { Block } from "../AST/Nodes/Block";
import { ConstantDeclaration } from "../AST/Nodes/ConstantDeclaration";
import { FunctionArgumentDeclaration } from "../AST/Nodes/FunctionArgumentDeclaration";
import { SourceFile } from "../AST/Nodes/SourceFile";
import { UnboundFunctionDeclaration } from "../AST/Nodes/UnboundFunctionDeclaration";
import { VariableDeclaration } from "../AST/Nodes/VariableDeclaration";
import { VariableReferenceExpression } from "../AST/Nodes/VariableReferenceExpression";
import { CompilerError, UndeclaredVariableUsageError } from "../Parser/ParserError";
import { IType } from "../Type/Type";

export enum VariableScopeEntryType {
  globalUnboundFunction,
  variable,
  constant,
  argument,
}
export type VariableScopeEntryDeclarationType = UnboundFunctionDeclaration | VariableDeclaration | ConstantDeclaration | FunctionArgumentDeclaration;
let index = 0;
export class VariableScopeEntry {
  public index: number;
  public str: string;
  public entryType: VariableScopeEntryType;
  public type: IType | undefined;
  public declaration: VariableScopeEntryDeclarationType;
  constructor(str: string, entryType: VariableScopeEntryType, declaration: VariableScopeEntryDeclarationType, type?: IType | undefined) {
    this.str = str;
    this.entryType = entryType;
    this.type = type;
    this.declaration = declaration;
    this.index = index++;
  }
}
export class VariableScope {
  public parent: VariableScope | undefined;
  public entryMap: Map<string, VariableScopeEntry> = new Map();
  constructor(parent?: VariableScope | undefined) {
    this.parent = parent;
  }
  public resolve(str: string): VariableScopeEntry | undefined {
    const entry = this.entryMap.get(str);
    if (entry !== undefined) {
      return entry;
    }
    if (this.parent !== undefined) {
      return this.parent.resolve(str);
    }
    return undefined;
  }
  public register(entry: VariableScopeEntry) {
    this.entryMap.set(entry.str, entry);
  }
}
export class VariableScopeBuilder extends ASTWalker {
  public sourceFile: SourceFile;
  public scopes: VariableScope[] = [];
  public errors: CompilerError[];
  constructor(sourceFile: SourceFile, errorBuffer: CompilerError[]) {
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
        const type = undefined;
        const entry = new VariableScopeEntry(str, entryType, declaration, type);
        globalScope.register(entry);
      }
    }
  }
  public buildScopes() {
    this.walkSourceFile(this.sourceFile);
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
    super.walkVariableDeclaration(variableDeclaration);
  }
  public walkConstantDeclaration(constantDeclaration: ConstantDeclaration) {
    const str = constantDeclaration.identifierToken.content;
    const entryType = VariableScopeEntryType.variable;
    const type = constantDeclaration.typeHint;
    const entry = new VariableScopeEntry(str, entryType, constantDeclaration, type !== undefined ? type.type : undefined);
    this.scopes[this.scopes.length - 1].register(entry);
    super.walkConstantDeclaration(constantDeclaration);
  }
  public walkArgumentDeclaration(argumentDeclaration: FunctionArgumentDeclaration) {
    const str = argumentDeclaration.name.content;
    const entryType = VariableScopeEntryType.variable;
    const type = argumentDeclaration.type;
    const entry = new VariableScopeEntry(str, entryType, argumentDeclaration, type.type);
    this.scopes[this.scopes.length - 1].register(entry);
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
}
