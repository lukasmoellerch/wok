import { InfixOperatorDeclaration } from "../AST/Nodes/InfixOperatorDeclaration";
import { PostfixOperatorDeclaration } from "../AST/Nodes/PostfixOperatorDeclaration";
import { PrefixOperatorDeclaration } from "../AST/Nodes/PrefixOperatorDeclaration";



export class PrefixOperatorEntry {
  public str: string;
  public declaration: PrefixOperatorDeclaration;
  constructor(str: string, declaration: PrefixOperatorDeclaration) {
    this.str = str;
    this.declaration = declaration;
  }
}
export class InfixOperatorEntry {
  public str: string;
  public declaration: InfixOperatorDeclaration;
  public precedence: number;
  public leftAssociative: boolean;
  constructor(str: string, declaration: InfixOperatorDeclaration) {
    this.str = str;
    this.declaration = declaration;
    this.precedence = parseInt(declaration.precedenceToken.content, 10);
    this.leftAssociative = declaration.associativityToken.content === "left";
  }
}
export class PostfixOperatorEntry {
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
