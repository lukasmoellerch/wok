import { ITypeCheckingType } from "../AST/ExpressionType";
import { TypeProvider } from "./TypeProvider";

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
export class TemplateManager {
  public namedTemplates: Map<string, TypeTreeNodeTemplate>;
  constructor(private parent: TypeTreeNode | undefined) {
    this.namedTemplates = new Map();
  }
  public registerNewNamedTemplate(name: string, template: TypeTreeNodeTemplate) {
    this.namedTemplates.set(name, template);
  }
  public getChildTreeNode(name: string, args: TypeTreeNode[] = []): TypeTreeNode | undefined {
    const id = `#${name}%(${args.map((arg) => arg.toString()).join("$")})`;
    const template = this.namedTemplates.get(name);
    if (template === undefined) {
      return undefined;
    }
    const node = template.create(args);
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
}
export class TypeTreeNode {
  public rootTypeTreeNode: TypeTreeNode;
  public args: TypeTreeNode[];
  public treeNodeName: string;
  public kind: TypeTreeNodeKind;
  public parent: TypeTreeNode | undefined;
  public typeCheckingType: ITypeCheckingType | undefined;
  public typeProvider: TypeProvider;
  public templateManager: TemplateManager;
  constructor(parent: TypeTreeNode | undefined, args: TypeTreeNode[], treeNodeName: string, kind: TypeTreeNodeKind, typeCheckingType?: ITypeCheckingType, templateManager?: TemplateManager) {
    this.typeCheckingType = typeCheckingType;
    const tm = templateManager || new TemplateManager(parent);
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
    this.templateManager = tm;
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
    this.templateManager.registerNewNamedTemplate(name, template);
  }
  public getChildTreeNode(name: string, args: TypeTreeNode[] = []): TypeTreeNode | undefined {
    return this.templateManager.getChildTreeNode(name, args);
  }
  public resolve(name: string, args: TypeTreeNode[] = []): TypeTreeNode | undefined {
    return this.templateManager.resolve(name, args);
  }
  public hsaNamedTemplate(name: string): boolean {
    return this.templateManager.hsaNamedTemplate(name);
  }
  public forceResolve(name: string, args: TypeTreeNode[] = []): TypeTreeNode {
    return this.templateManager.forceResolve(name, args);
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
