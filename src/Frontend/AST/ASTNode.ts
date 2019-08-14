export interface IASTNode {
  attributes: Map<keyof IAttributeMap, IAttribute>;
  children: IASTNode[];
}
interface IAttributeMap {
  type: ITypeAttribute;
  name: INameAttribute;
}
interface IAttribute {
  kind: keyof IAttributeMap;
}
interface ITypeAttribute extends IAttribute {
  type: number;
}
interface INameAttribute extends IAttribute {
  name: string;
}

export class ASTNode implements IASTNode {
  public attributes: Map<keyof IAttributeMap, IAttribute> = new Map();
  public children: IASTNode[] = [];
  public getAttribute<T extends keyof IAttributeMap>(kind: T): IAttributeMap[T] {
    const attribute = this.attributes.get(kind);
    if (attribute === undefined) {
      throw new Error("Attribute with specified name was not found");
    }
    return attribute as IAttributeMap[T];
  }
  public setAttribute(attribute: ITypeAttribute) {
    this.attributes.set(attribute.kind, attribute);
  }
  public deleteAttribute<T extends keyof IAttributeMap>(kind: T) {
    this.attributes.delete(kind);
  }
}
