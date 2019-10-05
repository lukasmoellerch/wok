import { IType } from "../Type/Type";
import { VoidType } from "../Type/VoidType";
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
type INonGenericType = new (provider: TypeProvider, thisRef: SpecializedTypeReference) => IType;
export class NonGenericTypeTemplate implements IGenericTypeTemplate {
  public argsNeeded = 0;
  constructor(
    public identifier: GenericTypeIdentifier,
    private type: INonGenericType,
  ) {

  }
  public createWithArguments(provider: TypeProvider, thisRef: SpecializedTypeReference, args: SpecializedTypeReference[]): IType {
    if (args.length !== 0) {
      throw new Error();
    }
    return new this.type(provider, thisRef);
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
  createWithArguments(provider: TypeProvider, thisRef: SpecializedTypeReference, args: SpecializedTypeReference[]): IType;
}

export class TypeProvider {
  public map: Map<string, IGenericTypeTemplate>;
  public specializedTypes: IType[];
  public specializedGenerics: Map<string, number>;
  public typeReferenceMap: Map<IType, SpecializedTypeReference> = new Map();
  public voidIdentifier = new SpecializedTypeReference(-1);
  public voidType = new VoidType();
  public lazyMapping: Map<number, [GenericTypeIdentifier, SpecializedTypeReference, SpecializedTypeReference[]]> = new Map();
  private indexTypeDescriptionMap: Map<number, string> = new Map();
  constructor() {
    this.map = new Map();
    this.specializedTypes = [];
    this.specializedGenerics = new Map();
  }
  public getReference(type: IType): SpecializedTypeReference {
    const res = this.typeReferenceMap.get(type);
    if (res === undefined) {
      throw new Error();
    }
    return res;
  }
  public get(reference: SpecializedTypeReference): IType {
    if (reference.index === -1) {
      return this.voidType;
    }
    const a = this.specializedTypes[reference.index];
    if (a !== undefined) {
      return a;
    }
    const c = this.lazyMapping.get(reference.index);
    if (c === undefined) {
      throw new Error();
    }
    const genericIdentifier = c[0];
    const generic = this.getGeneric(genericIdentifier);
    if (generic === undefined) {
      throw new Error();
    }
    const ref = c[1];
    const args = c[2];

    const b = generic.createWithArguments(this, ref, args);

    this.specializedTypes[reference.index] = b;
    const str = this.stringify(genericIdentifier, args);

    return b;

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
  public specialize(generic: IGenericTypeTemplate, args: SpecializedTypeReference[] = []): SpecializedTypeReference {
    this.ensureGeneric(generic);
    return this.specializeGeneric(generic.identifier, args);
  }
  public specializeGeneric(genericIdentifier: GenericTypeIdentifier, args: SpecializedTypeReference[] = []): SpecializedTypeReference {
    const str = this.stringify(genericIdentifier, args);

    const a = this.specializedGenerics.get(str);
    if (a !== undefined) {
      return new SpecializedTypeReference(a);
    }
    const generic = this.getGeneric(genericIdentifier);
    if (generic === undefined) {
      throw new Error();
    }
    const index = this.specializedTypes.length;
    this.specializedTypes.push(undefined as unknown as IType);
    const ref = new SpecializedTypeReference(index);
    this.lazyMapping.set(index, [genericIdentifier, ref, args]);
    this.specializedGenerics.set(str, index);
    return ref;
  }
  public debugString(): string {
    return [...this.map.entries()].map((a) => {
      return `${a[0]}(#${a[1].argsNeeded})`;
    }).join("\n") + "\n" + [...this.indexTypeDescriptionMap.keys()].sort().map((key) => {
      const value = this.indexTypeDescriptionMap.get(key);
      if (value === undefined) {
        throw new Error();
      }
      return `#${key}:\t${value}`;
    }).join("\n");
  }
  private getGeneric(identifier: GenericTypeIdentifier): IGenericTypeTemplate | undefined {
    return this.map.get(identifier.declarationNodeName);
  }
  private stringify(generic: GenericTypeIdentifier, args: SpecializedTypeReference[]): string {
    return `${generic.declarationNodeName}(${args.map((a) => "#" + a.index).join(", ")})`;
  }
}
