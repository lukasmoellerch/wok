
import { GenericTypeIdentifier, IGenericTypeTemplate, NonGenericTypeTemplate, SpecializedTypeReference } from "../Type Scope/TypeProvider";
import { ArgumentlessTypeTreeNodeTemplate, TypeTreeNode, TypeTreeNodeTemplate } from "../Type Scope/TypeScope";
import { NativeIntegerType, PointerType, RawPointerType, StringType } from "./NativeType";
import { IType } from "./Type";

class PointerGenericTypeTemplate implements IGenericTypeTemplate {
  public argsNeeded: number = 1;
  constructor(private node: TypeTreeNode, public identifier: GenericTypeIdentifier) {

  }
  public createWithoutArguments(): IType {
    throw new Error("Method not implemented.");
  }
  public createWithArguments(args: SpecializedTypeReference[]): IType {
    return new PointerType(this.node, this.node.typeProvider.get(args[0]));
  }

}
class PointerTypeTemplate extends TypeTreeNodeTemplate {
  constructor(private parent: TypeTreeNode, private identifier: GenericTypeIdentifier) {
    super();
  }
  public create(args: TypeTreeNode[]): TypeTreeNode {
    const stored = args[0].typeReference;
    if (stored === undefined) {
      throw new Error();
    }
    const typeReference = this.parent.typeProvider.specializeGeneric(this.identifier, [stored]);

    const typeTreeNode = new TypeTreeNode(this.parent, args, "Pointer", "native");
    typeTreeNode.typeReference = typeReference;
    return typeTreeNode;
  }
}

export function injectNativeTypes(rootNode: TypeTreeNode) {
  function register(name: string, type: IType) {
    const node = new TypeTreeNode(rootNode, [], name, "native");
    const identifier = GenericTypeIdentifier.fromTypeTreeNode(node);
    const genericTemplate = new NonGenericTypeTemplate(identifier, type);
    rootNode.typeProvider.ensureGeneric(genericTemplate);
    node.typeReference = node.typeProvider.specializeGeneric(identifier, []);
    const typeTreeNodeTemplate = new ArgumentlessTypeTreeNodeTemplate(node);
    rootNode.registerNewNamedTemplate(name, typeTreeNodeTemplate);
  }
  function registerPointer() {
    const nameNode = new TypeTreeNode(rootNode, [], "Pointer", "native");
    const identifier = GenericTypeIdentifier.fromTypeTreeNode(nameNode);
    const genericTemplate = new PointerGenericTypeTemplate(rootNode, identifier);
    rootNode.typeProvider.ensureGeneric(genericTemplate);

    const template = new PointerTypeTemplate(rootNode, identifier);

    rootNode.registerNewNamedTemplate("Pointer", template);
  }
  register("UInt8", new NativeIntegerType(rootNode, false, 1));
  register("UInt16", new NativeIntegerType(rootNode, false, 2));
  register("UInt32", new NativeIntegerType(rootNode, false, 4));
  register("UInt64", new NativeIntegerType(rootNode, false, 8));

  register("Int8", new NativeIntegerType(rootNode, true, 1));
  register("Int16", new NativeIntegerType(rootNode, true, 2));
  register("Int32", new NativeIntegerType(rootNode, true, 4));
  register("Int64", new NativeIntegerType(rootNode, true, 8));

  register("RawPointer", new RawPointerType(rootNode));

  register("Bool", new NativeIntegerType(rootNode, false, 1));
  register("Int", new NativeIntegerType(rootNode, false, 1));
  register("UInt", new NativeIntegerType(rootNode, false, 1));

  register("String", new StringType(rootNode));
  registerPointer();
}
