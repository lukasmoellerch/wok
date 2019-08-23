import { IType } from "../Type/Type";

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
