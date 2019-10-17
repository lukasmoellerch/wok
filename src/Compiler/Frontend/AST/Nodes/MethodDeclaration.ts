import { Token } from "../../Lexer/Token";
import { TypeTreeNode } from "../../Type Scope/TypeScope";
import { TypeCheckingFunctionType } from "../../Type/FunctionType";
import { TypeCheckingVoidType } from "../../Type/VoidType";
import { VariableScopeEntry } from "../../VariableScope/VariableScope";
import { ITopLevelDeclaration } from "../AST";
import { ASTNode } from "../ASTNode";
import { ITypeCheckingType } from "../ExpressionType";
import { Block } from "./Block";
import { Decorator } from "./Decorator";
import { ExpressionWrapper } from "./ExpressionWrapper";
import { FunctionArgumentDeclaration } from "./FunctionArgumentDeclaration";
import { FunctionResultDeclaration } from "./FunctionResultDeclaration";

export class MethodDeclaration extends ASTNode implements ITopLevelDeclaration {
  public name = "MethodDeclaration";
  public decorators: Decorator[];
  public decoratorMap: Map<string, ExpressionWrapper[]> = new Map();
  public functionNameToken: Token;
  public topLevelDeclarable: void;
  public nameToken: Token;
  public argumentDeclarations: FunctionArgumentDeclaration[];
  public block: Block | undefined;
  public entry: VariableScopeEntry | undefined;
  public variables: VariableScopeEntry[] = [];
  public resultDeclaration: FunctionResultDeclaration | undefined;
  public thisEntry: VariableScopeEntry | undefined;
  constructor(decorators: Decorator[], functionNameToken: Token, name: Token, argumentDeclarations: FunctionArgumentDeclaration[], block?: Block, resultDeclaration?: FunctionResultDeclaration) {
    super();
    this.decorators = decorators;
    for (const decorator of decorators) {
      this.decoratorMap.set(decorator.nameToken.content, decorator.parameters);
    }
    this.functionNameToken = functionNameToken;
    this.nameToken = name;
    this.argumentDeclarations = argumentDeclarations;
    this.block = block;
    this.resultDeclaration = resultDeclaration;
    if (block === undefined) {
      if (resultDeclaration === undefined) {
        this.children = [...decorators, functionNameToken, name, ...argumentDeclarations];
      } else {
        this.children = [...decorators, functionNameToken, name, ...argumentDeclarations, resultDeclaration];
      }
    } else {
      if (resultDeclaration === undefined) {
        this.children = [...decorators, functionNameToken, name, ...argumentDeclarations, block];
      } else {
        this.children = [...decorators, functionNameToken, name, ...argumentDeclarations, resultDeclaration, block];
      }
    }
  }
  public getFunctionType(node: TypeTreeNode, thisType: ITypeCheckingType): TypeCheckingFunctionType {
    const argTypes = this.argumentDeclarations.map((a) => a.type.type as ITypeCheckingType);
    const resultDeclaration = this.resultDeclaration;
    const resultType = resultDeclaration !== undefined ? (resultDeclaration.type.type || new TypeCheckingVoidType(node)) : new TypeCheckingVoidType(node);
    return new TypeCheckingFunctionType(node, argTypes, resultType, thisType);
  }
}
