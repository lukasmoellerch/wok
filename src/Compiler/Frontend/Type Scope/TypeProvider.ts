import { IType } from "../Type/Type";
import { TypeTreeNode } from "./TypeScope";

export class GenericTypeIdentifier {
  public static fromTypeTreeNode(node: TypeTreeNode): GenericTypeIdentifier {
    return new GenericTypeIdentifier(node.toString());
  }
  public declarationNodeName: string;
  constructor(declarationNodeName: string) {
    this.declarationNodeName = declarationNodeName;
  }
}
export class NonGenericTypeTemplate implements IGenericTypeTemplate {
  public argsNeeded = 0;
  constructor(
    public identifier: GenericTypeIdentifier,
    private type: IType,
  ) {

  }
  public createWithoutArguments(): IType {
    return this.type;
  }
  public createWithArguments(args: SpecializedTypeReference[]): IType {
    if (args.length !== 0) {
      throw new Error();
    }
    return this.type;
  }
}

export class SpecializedTypeReference {
  constructor(
    public index: number,
  ) { }
}

export interface IGenericTypeTemplate {
  identifier: GenericTypeIdentifier;
  argsNeeded: number;
  createWithoutArguments(): IType;
  createWithArguments(args: SpecializedTypeReference[]): IType;
}

export class TypeProvider {
  public map: Map<string, IGenericTypeTemplate>;
  public specializedTypes: IType[];
  public specializedGenerics: Map<string, number>;
  constructor() {
    this.map = new Map();
    this.specializedTypes = [];
    this.specializedGenerics = new Map();
  }
  public get(reference: SpecializedTypeReference): IType {
    return this.specializedTypes[reference.index];
  }
  public addGeneric(generic: IGenericTypeTemplate) {
    if (this.map.has(generic.identifier.declarationNodeName)) {
      throw new Error();
    }
    this.map.set(generic.identifier.declarationNodeName, generic);
  }
  public ensureGeneric(generic: IGenericTypeTemplate) {
    if (this.map.has(generic.identifier.declarationNodeName)) {
      return;
    }
    this.addGeneric(generic);
  }
  public specializeGeneric(genericIdentifier: GenericTypeIdentifier, args: SpecializedTypeReference[]): SpecializedTypeReference | undefined {
    const str = this.stringify(genericIdentifier, args);
    const a = this.specializedGenerics.get(str);
    if (a !== undefined) {
      return new SpecializedTypeReference(a);
    }
    const generic = this.getGeneric(genericIdentifier);
    if (generic === undefined) {
      return undefined;
    }
    const b = generic.createWithArguments(args);
    const index = this.specializedTypes.length;
    this.specializedTypes.push(b);
    this.specializedGenerics.set(str, index);
    return new SpecializedTypeReference(index);
  }
  public debugString(): string {
    return [...this.map.entries()].map((a) => {
      return `${a[0]}(#${a[1].argsNeeded})`;
    }).join("\n") + "\n" + [...this.specializedGenerics.entries()].map((a) => {
      return `#${a[1]}:\t${a[0]}`;
    }).join("\n");
  }
  private getGeneric(identifier: GenericTypeIdentifier): IGenericTypeTemplate | undefined {
    return this.map.get(identifier.declarationNodeName);
  }
  private stringify(generic: GenericTypeIdentifier, args: SpecializedTypeReference[]): string {
    return `${generic.declarationNodeName}(${args.map((a) => "#" + a.index).join(", ")})`;
  }
}
