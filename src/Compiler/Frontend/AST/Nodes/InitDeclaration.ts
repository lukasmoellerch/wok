import { Token } from "../../Lexer/Token";
import { TypeTreeNode } from "../../Type Scope/TypeScope";
import { TypeCheckingFunctionType } from "../../Type/FunctionType";
import { VariableScopeEntry } from "../../VariableScope/VariableScope";
import { ASTNode } from "../ASTNode";
import { ITypeCheckingType } from "../ExpressionType";
import { Block } from "./Block";
import { Decorator } from "./Decorator";
import { ExpressionWrapper } from "./ExpressionWrapper";
import { FunctionArgumentDeclaration } from "./FunctionArgumentDeclaration";

export class InitDeclaration extends ASTNode {
  public name = "InitDeclaration";
  public decorators: Decorator[];
  public decoratorMap: Map<string, ExpressionWrapper[]> = new Map();
  public argumentDeclarations: FunctionArgumentDeclaration[];
  public block: Block | undefined;
  public entry: VariableScopeEntry | undefined;
  public variables: VariableScopeEntry[] = [];
  public thisEntry: VariableScopeEntry | undefined;
  constructor(decorators: Decorator[], initToken: Token, argumentDeclarations: FunctionArgumentDeclaration[], block?: Block) {
    super();
    this.decorators = decorators;
    for (const decorator of decorators) {
      this.decoratorMap.set(decorator.nameToken.content, decorator.parameters);
    }
    this.argumentDeclarations = argumentDeclarations;
    this.block = block;
    if (block === undefined) {
      this.children = [...decorators, initToken, ...argumentDeclarations];
    } else {
      this.children = [...decorators, initToken, ...argumentDeclarations, block];
    }
  }
  public getFunctionType(node: TypeTreeNode, thisType: ITypeCheckingType): TypeCheckingFunctionType {
    const argTypes = this.argumentDeclarations.map((a) => a.type.type as ITypeCheckingType);
    const resultType = thisType;
    return new TypeCheckingFunctionType(node, argTypes, resultType, undefined);
  }
}
