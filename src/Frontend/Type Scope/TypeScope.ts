import { IType } from "../Type/Type";

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
  public instanceType: IType | undefined;
  constructor(parent: TypeTreeNode | undefined, args: TypeTreeNode[], treeNodeName: string, kind: TypeTreeNodeKind, instanceType?: IType | undefined) {
    if (parent !== undefined) {
      this.rootTypeTreeNode = parent.rootTypeTreeNode;
    } else {
      this.rootTypeTreeNode = this;
    }
    this.parent = parent;
    this.args = args;
    this.treeNodeName = treeNodeName;
    this.kind = kind;
    this.namedTemplates = new Map();
    this.instanceType = instanceType;
  }
  public toString(): string {
    const parent = this.parent;
    if (parent === undefined) {
      return this.treeNodeName;
    } else {
      return parent.toString() + "." + this.treeNodeName;
    }
  }
  public registerNewNamedTemplate(name: string, template: TypeTreeNodeTemplate) {
    this.namedTemplates.set(name, template);
  }
  public getChildTreeNode(name: string, args: TypeTreeNode[] = []): TypeTreeNode | undefined {
    const template = this.namedTemplates.get(name);
    if (template === undefined) {
      return undefined;
    }
    return template.create(args);
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
    const result = this.instanceType;
    if (result === undefined) {
      throw new Error();
    }
    return result;
  }
}
export class GlobalTypeTreeNode extends TypeTreeNode {
  constructor() {
    super(undefined, [], "global", "global");
  }

}
