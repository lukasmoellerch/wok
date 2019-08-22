import { ConstantDeclaration } from "../AST/Nodes/ConstantDeclaration";
import { FunctionArgumentDeclaration } from "../AST/Nodes/FunctionArgumentDeclaration";
import { UnboundFunctionDeclaration } from "../AST/Nodes/UnboundFunctionDeclaration";
import { VariableDeclaration } from "../AST/Nodes/VariableDeclaration";
import { TypeExpression } from "../Type/UnresolvedType/TypeExpression";

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
  public type: TypeExpression | undefined;
  public declaration: VariableScopeEntryDeclarationType;
  constructor(str: string, entryType: VariableScopeEntryType, declaration: VariableScopeEntryDeclarationType, type?: TypeExpression | undefined) {
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
