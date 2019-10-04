import { IType } from "../Type/Type";
import { SpecializedTypeReference, TypeProvider } from "./TypeProvider";

export type TypeTreeNodeKind = "struct" | "protocol" | "class" | "component" | "native" | "global" | "block" | "function";
export class TypeTreeNodeTemplate {
  public requiredArgs: number = 0;
  public create(_args: TypeTreeNode[]): TypeTreeNode {
    throw new Error();
  }
}
export class ArgumentlessTypeTreeNodeTemplate extends TypeTreeNodeTemplate {
  public requiredArgs: number = 0;
  public typeTreeNode: TypeTreeNode;
  constructor(typeTreeNode: TypeTreeNode) {
    super();
    this.typeTreeNode = typeTreeNode;
  }
  public create(_args: TypeTreeNode[]): TypeTreeNode {
    return this.typeTreeNode;
  }
}
export class TypeTreeNode {
  public rootTypeTreeNode: TypeTreeNode;
  public args: TypeTreeNode[];
  public treeNodeName: string;
  public kind: TypeTreeNodeKind;
  public namedTemplates: Map<string, TypeTreeNodeTemplate>;
  public parent: TypeTreeNode | undefined;
  public typeReference: SpecializedTypeReference | undefined;
  public typeProvider: TypeProvider;
  private childTreeNodeCache: Map<string, TypeTreeNode> = new Map();
  constructor(parent: TypeTreeNode | undefined, args: TypeTreeNode[], treeNodeName: string, kind: TypeTreeNodeKind, typeReference?: SpecializedTypeReference | undefined) {
    if (parent !== undefined) {
      this.rootTypeTreeNode = parent.rootTypeTreeNode;
      this.typeProvider = parent.typeProvider;
    } else {
      this.rootTypeTreeNode = this;
      this.typeProvider = new TypeProvider();
    }
    this.parent = parent;
    this.args = args;
    this.treeNodeName = treeNodeName;
    this.kind = kind;
    this.namedTemplates = new Map();
    this.typeReference = typeReference;
  }
  public toString(): string {
    const parent = this.parent;
    if (parent === undefined) {
      return this.treeNodeName;
    } else {
      if (this.args.length > 0) {
        return parent.parentPrefix() + this.treeNodeName + "<" + this.args.map((a) => a.toString()).join(", ") + ">";
      } else {
        return parent.parentPrefix() + this.treeNodeName;
      }
    }
  }
  public parentPrefix(): string {
    return this.toString() + ".";
  }
  public registerNewNamedTemplate(name: string, template: TypeTreeNodeTemplate) {
    this.namedTemplates.set(name, template);
  }
  public getChildTreeNode(name: string, args: TypeTreeNode[] = []): TypeTreeNode | undefined {
    const id = `#${name}%(${args.map((arg) => arg.toString()).join("$")})`;
    const cached = this.childTreeNodeCache.get(id);
    if (cached !== undefined) {
      return cached;
    }
    const template = this.namedTemplates.get(name);
    if (template === undefined) {
      return undefined;
    }
    const node = template.create(args);
    this.childTreeNodeCache.set(id, node);
    return node;
  }
  public resolve(name: string, args: TypeTreeNode[] = []): TypeTreeNode | undefined {
    const node = this.getChildTreeNode(name, args);
    if (node !== undefined) {
      return node;
    }
    const parent = this.parent;
    if (parent !== undefined) {
      return parent.resolve(name, args);
    }
    return undefined;
  }
  public hsaNamedTemplate(name: string): boolean {
    if (this.namedTemplates.has(name)) {
      return true;
    }
    const parent = this.parent;
    if (parent === undefined) {
      return false;
    }
    return parent.hsaNamedTemplate(name);
  }
  public forceResolve(name: string, args: TypeTreeNode[] = []): TypeTreeNode {
    const result = this.resolve(name, args);
    if (result === undefined) {
      throw new Error();
    }
    return result;
  }
  public forceInstanceType(): IType {
    const result = this.typeReference;
    if (result === undefined) {
      throw new Error();
    }
    return this.typeProvider.get(result);
  }
  public get type(): IType {
    const typeReference = this.typeReference;
    if (typeReference === undefined) {
      throw new Error();
    }
    return this.typeProvider.get(typeReference);
  }
}
export class GlobalTypeTreeNode extends TypeTreeNode {
  constructor() {
    super(undefined, [], "global", "global");
  }
  public toString(): string {
    return "global";
  }
  public parentPrefix(): string {
    return "";
  }
}
