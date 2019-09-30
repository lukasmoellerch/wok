
import { ArgumentlessTypeTreeNodeTemplate, TypeTreeNode, TypeTreeNodeTemplate } from "../Type Scope/TypeScope";
import { NativeIntegerType, PointerType, RawPointerType, StringType } from "./NativeType";

class PointerTypeTemplate extends TypeTreeNodeTemplate {
  private createdPointerTypes: PointerType[] = [];
  constructor(private parent: TypeTreeNode) {
    super();
  }
  public create(args: TypeTreeNode[]): TypeTreeNode {
    const typeTreeNode = new TypeTreeNode(this.parent, args, "Pointer", "native");
    typeTreeNode.registerNewNamedTemplate("Stored", new ArgumentlessTypeTreeNodeTemplate(args[0]));
    const pointerInstanceType = new PointerType(typeTreeNode);
    this.createdPointerTypes.push(pointerInstanceType);
    typeTreeNode.instanceType = pointerInstanceType;
    return typeTreeNode;
  }
}

export function injectNativeTypes(rootNode: TypeTreeNode) {
  rootNode.registerNewNamedTemplate("UInt8", new ArgumentlessTypeTreeNodeTemplate(new TypeTreeNode(rootNode, [], "UInt8", "native", new NativeIntegerType(rootNode, false, 1))));
  rootNode.registerNewNamedTemplate("UInt16", new ArgumentlessTypeTreeNodeTemplate(new TypeTreeNode(rootNode, [], "UInt16", "native", new NativeIntegerType(rootNode, false, 2))));
  rootNode.registerNewNamedTemplate("UInt32", new ArgumentlessTypeTreeNodeTemplate(new TypeTreeNode(rootNode, [], "UInt32", "native", new NativeIntegerType(rootNode, false, 4))));
  rootNode.registerNewNamedTemplate("UInt64", new ArgumentlessTypeTreeNodeTemplate(new TypeTreeNode(rootNode, [], "UInt64", "native", new NativeIntegerType(rootNode, false, 8))));

  rootNode.registerNewNamedTemplate("Int8", new ArgumentlessTypeTreeNodeTemplate(new TypeTreeNode(rootNode, [], "Int8", "native", new NativeIntegerType(rootNode, true, 1))));
  rootNode.registerNewNamedTemplate("Int16", new ArgumentlessTypeTreeNodeTemplate(new TypeTreeNode(rootNode, [], "Int16", "native", new NativeIntegerType(rootNode, true, 2))));
  rootNode.registerNewNamedTemplate("Int32", new ArgumentlessTypeTreeNodeTemplate(new TypeTreeNode(rootNode, [], "Int32", "native", new NativeIntegerType(rootNode, true, 4))));
  rootNode.registerNewNamedTemplate("Int64", new ArgumentlessTypeTreeNodeTemplate(new TypeTreeNode(rootNode, [], "Int64", "native", new NativeIntegerType(rootNode, true, 8))));

  rootNode.registerNewNamedTemplate("RawPointer", new ArgumentlessTypeTreeNodeTemplate(new TypeTreeNode(rootNode, [], "RawPointer", "native", new RawPointerType(rootNode))));

  rootNode.registerNewNamedTemplate("Bool", new ArgumentlessTypeTreeNodeTemplate(rootNode.forceResolve("UInt8")));
  rootNode.registerNewNamedTemplate("Int", new ArgumentlessTypeTreeNodeTemplate(rootNode.forceResolve("Int32")));
  rootNode.registerNewNamedTemplate("UInt", new ArgumentlessTypeTreeNodeTemplate(rootNode.forceResolve("UInt32")));

  rootNode.registerNewNamedTemplate("String", new ArgumentlessTypeTreeNodeTemplate(new TypeTreeNode(rootNode, [], "String", "native", new StringType(rootNode))));

  rootNode.registerNewNamedTemplate("Pointer", new PointerTypeTemplate(rootNode));

}
