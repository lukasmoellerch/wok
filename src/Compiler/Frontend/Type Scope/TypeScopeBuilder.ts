import { ASTWalker } from "../AST/ASTWalker";
import { TypeVariable } from "../AST/ExpressionType";
import { Block } from "../AST/Nodes/Block";
import { ClassDeclaration } from "../AST/Nodes/ClassDeclaration";
import { ExpressionWrapper } from "../AST/Nodes/ExpressionWrapper";
import { SourceFile } from "../AST/Nodes/SourceFile";
import { StructDeclaration } from "../AST/Nodes/StructDeclaration";
import { UnboundFunctionDeclaration } from "../AST/Nodes/UnboundFunctionDeclaration";
import { TypeCheckingClassType } from "../Type/ClassType";
import { TypeCheckingStructType } from "../Type/StructType";
import { TypeExpressionWrapper } from "../Type/UnresolvedType/TypeExpressionWrapper";
import { ArgumentlessTypeTreeNodeTemplate, TemplateManager, TypeTreeNode, TypeTreeNodeTemplate } from "./TypeScope";

class StructTypeTreeNode implements TypeTreeNodeTemplate {
  public requiredArgs: number;
  constructor(
    private templateManager: TemplateManager,
    private parent: TypeTreeNode,
    private declaration: StructDeclaration,
  ) {
    this.requiredArgs = declaration.genericVariables.length;
  }
  public create(args: TypeTreeNode[]): TypeTreeNode {
    const typeTreeNode = new TypeTreeNode(this.parent, args, this.declaration.nameToken.content, "struct", undefined, this.templateManager);
    const type = new TypeCheckingStructType(typeTreeNode, this.declaration);
    typeTreeNode.typeCheckingType = type;
    for (let i = 0; i < this.requiredArgs; i++) {
      const name = this.declaration.genericVariables[i].content;
      const typecheckingType = args[i].typeCheckingType;
      const variableNode = new TypeTreeNode(typeTreeNode, [], name, "struct", typecheckingType);
      typeTreeNode.registerNewNamedTemplate(name, new ArgumentlessTypeTreeNodeTemplate(variableNode));
    }
    return typeTreeNode;
  }
}
class ClassTypeTreeNode implements TypeTreeNodeTemplate {
  public requiredArgs: number;
  constructor(
    private templateManager: TemplateManager,
    private parent: TypeTreeNode,
    private declaration: ClassDeclaration,
  ) {
    this.requiredArgs = declaration.genericVariables.length;
  }
  public create(args: TypeTreeNode[]): TypeTreeNode {
    const typeTreeNode = new TypeTreeNode(this.parent, args, this.declaration.nameToken.content, "class", undefined, this.templateManager);
    const type = new TypeCheckingClassType(typeTreeNode, this.declaration);
    typeTreeNode.typeCheckingType = type;
    for (let i = 0; i < this.requiredArgs; i++) {
      const name = this.declaration.genericVariables[i].content;
      const typecheckingType = args[i].typeCheckingType;
      const variableNode = new TypeTreeNode(typeTreeNode, [], name, "class", typecheckingType);
      typeTreeNode.registerNewNamedTemplate(name, new ArgumentlessTypeTreeNodeTemplate(variableNode));
    }
    return typeTreeNode;
  }
}

export class TypeScopeBuilder extends ASTWalker {
  public sourceFile: SourceFile;
  public scopes: TypeTreeNode[] = [];
  public templateManagers: TemplateManager[] = [];
  constructor(sourceFile: SourceFile) {
    super();
    this.sourceFile = sourceFile;
  }
  public populateGlobalTypeScope(globalScope: TypeTreeNode) {
    this.scopes = [globalScope];
    this.templateManagers = [globalScope.templateManager];
    for (const declaration of this.sourceFile.topLevelDeclarations) {
      if (declaration instanceof StructDeclaration) {
        this.registerStruct(declaration, globalScope, globalScope.templateManager);
        this.scopes.pop();
      } else if (declaration instanceof ClassDeclaration) {
        this.registerClass(declaration, globalScope, globalScope.templateManager);
        this.scopes.pop();
      }
    }
  }
  public buildScopes() {
    this.walkSourceFile(this.sourceFile);
  }
  public walkUnboundFunctionDeclaration(unboundFunctionDeclaration: UnboundFunctionDeclaration) {
    const parent = this.scopes.length > 0 ? this.scopes[this.scopes.length - 1] : undefined;

    const scope = new TypeTreeNode(parent, [], unboundFunctionDeclaration.functionNameToken.content, "function");
    this.scopes.push(scope);
    super.walkUnboundFunctionDeclaration(unboundFunctionDeclaration);
    this.scopes.pop();
  }
  public walkStructDeclaration(structDeclaration: StructDeclaration) {
    const parent = this.scopes[this.scopes.length - 1];
    const parentTM = this.templateManagers[this.templateManagers.length - 1];
    const tm = this.registerStruct(structDeclaration, parent, parentTM);
    this.templateManagers.push(tm);
    super.walkStructDeclaration(structDeclaration);
    this.templateManagers.pop();
    this.scopes.pop();
  }
  public walkClassDeclaration(classDeclaration: ClassDeclaration) {
    const parent = this.scopes[this.scopes.length - 1];
    const parentTM = this.templateManagers[this.templateManagers.length - 1];
    const tm = this.registerClass(classDeclaration, parent, parentTM);
    this.templateManagers.push(tm);
    super.walkClassDeclaration(classDeclaration);
    this.templateManagers.pop();
    this.scopes.pop();
  }
  public walkBlock(block: Block) {
    const parent = this.scopes.length > 0 ? this.scopes[this.scopes.length - 1] : undefined;
    const scope = new TypeTreeNode(parent, [], "block", "block");
    this.scopes.push(scope);
    super.walkBlock(block);
    this.scopes.pop();
  }
  protected walkTypeExpressionWrapper(typeExpressionWrapper: TypeExpressionWrapper) {
    super.walkTypeExpressionWrapper(typeExpressionWrapper);
    typeExpressionWrapper.wrappingTypeTreeNode = this.scopes[this.scopes.length - 1];
  }
  protected walkExpressionWrapper(expressionWrapper: ExpressionWrapper) {
    super.walkExpressionWrapper(expressionWrapper);
    expressionWrapper.wrappingTypeTreeNode = this.scopes[this.scopes.length - 1];
  }
  private registerStruct(declaration: StructDeclaration, parent: TypeTreeNode, parentTM: TemplateManager): TemplateManager {
    const node = new TypeTreeNode(parent, [], declaration.nameToken.content, "struct");
    const tct = new TypeCheckingStructType(node, declaration);
    node.typeCheckingType = tct;
    for (let i = 0; i < declaration.genericVariables.length; i++) {
      const name = declaration.genericVariables[i].content;
      const typecheckingType = new TypeVariable(node, name, undefined);
      const variableNode = new TypeTreeNode(node, [], name, "struct", typecheckingType);
      node.registerNewNamedTemplate(name, new ArgumentlessTypeTreeNodeTemplate(variableNode));
    }
    this.scopes.push(node);
    if (declaration.genericVariables.length === 0) {
      const type = new TypeCheckingStructType(parent, declaration);
      type.node = node;
      const template = new ArgumentlessTypeTreeNodeTemplate(node);
      declaration.template = template;
      declaration.typeCheckingType = type;
      node.typeCheckingType = type;
      parentTM.registerNewNamedTemplate(declaration.nameToken.content, template);
      return node.templateManager;
    } else {
      const templateManager = new TemplateManager(parent);
      const type = new TypeCheckingStructType(parent, declaration);
      const template = new StructTypeTreeNode(templateManager, parent, declaration);
      type.node = node;
      declaration.template = template;
      declaration.typeCheckingType = type;
      parentTM.registerNewNamedTemplate(declaration.nameToken.content, template);
      return templateManager;
    }
  }
  private registerClass(declaration: ClassDeclaration, parent: TypeTreeNode, parentTM: TemplateManager): TemplateManager {
    const node = new TypeTreeNode(parent, [], declaration.nameToken.content, "class");
    const tct = new TypeCheckingClassType(node, declaration);
    node.typeCheckingType = tct;
    for (let i = 0; i < declaration.genericVariables.length; i++) {
      const name = declaration.genericVariables[i].content;
      const typecheckingType = new TypeVariable(node, name, undefined);
      const variableNode = new TypeTreeNode(node, [], name, "class", typecheckingType);
      node.registerNewNamedTemplate(name, new ArgumentlessTypeTreeNodeTemplate(variableNode));
    }
    this.scopes.push(node);
    if (declaration.genericVariables.length === 0) {
      const type = new TypeCheckingClassType(parent, declaration);
      type.node = node;
      const template = new ArgumentlessTypeTreeNodeTemplate(node);
      declaration.template = template;
      declaration.typeCheckingType = type;
      node.typeCheckingType = type;
      parentTM.registerNewNamedTemplate(declaration.nameToken.content, template);
      return node.templateManager;
    } else {
      const templateManager = new TemplateManager(parent);
      const type = new TypeCheckingClassType(parent, declaration);
      const template = new ClassTypeTreeNode(templateManager, parent, declaration);
      type.node = node;
      declaration.template = template;
      declaration.typeCheckingType = type;
      parentTM.registerNewNamedTemplate(declaration.nameToken.content, template);
      return templateManager;
    }
  }
}
