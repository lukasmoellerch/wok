import { ConstantDeclaration } from "../AST/Nodes/ConstantDeclaration";
import { FunctionArgumentDeclaration } from "../AST/Nodes/FunctionArgumentDeclaration";
import { StructDeclaration } from "../AST/Nodes/StructDeclaration";
import { UnboundFunctionDeclaration } from "../AST/Nodes/UnboundFunctionDeclaration";
import { VariableDeclaration } from "../AST/Nodes/VariableDeclaration";
import { IType } from "../Type/Type";

export enum VariableScopeEntryType {
  globalUnboundFunction,
  variable,
  constant,
  argument,
  self,
}
export type VariableScopeEntryDeclarationType = UnboundFunctionDeclaration | VariableDeclaration | ConstantDeclaration | FunctionArgumentDeclaration | StructDeclaration;
let index = 0;
export class VariableScopeEntry {
  public index: number;
  public str: string;
  public entryType: VariableScopeEntryType;
  public type: IType | undefined;
  // Add this for generic types - reevaluate expression during compilation step
  // public typeExpressionWrapper: TypeExpressionWrapper
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
