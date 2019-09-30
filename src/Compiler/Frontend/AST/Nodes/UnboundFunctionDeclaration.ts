import { Token } from "../../Lexer/Token";
import { TypeTreeNode } from "../../Type Scope/TypeScope";
import { FunctionType } from "../../Type/FunctionType";
import { IType } from "../../Type/Type";
import { VoidType } from "../../Type/VoidType";
import { VariableScopeEntry } from "../../VariableScope/VariableScope";
import { ITopLevelDeclaration } from "../AST";
import { ASTNode } from "../ASTNode";
import { Block } from "./Block";
import { Decorator } from "./Decorator";
import { ExpressionWrapper } from "./ExpressionWrapper";
import { FunctionArgumentDeclaration } from "./FunctionArgumentDeclaration";
import { FunctionResultDeclaration } from "./FunctionResultDeclaration";

export class UnboundFunctionDeclaration extends ASTNode implements ITopLevelDeclaration {
  public decorators: Decorator[];
  public decoratorMap: Map<string, ExpressionWrapper[]> = new Map();
  public functionNameToken: Token;
  public topLevelDeclarable: void;
  public name: Token;
  public argumentDeclarations: FunctionArgumentDeclaration[];
  public block: Block | undefined;
  public entry: VariableScopeEntry | undefined;
  public variables: VariableScopeEntry[] = [];
  public resultDeclaration: FunctionResultDeclaration | undefined;
  constructor(decorators: Decorator[], functionNameToken: Token, name: Token, argumentDeclarations: FunctionArgumentDeclaration[], block?: Block, resultDeclaration?: FunctionResultDeclaration) {
    super();
    this.decorators = decorators;
    for (const decorator of decorators) {
      this.decoratorMap.set(decorator.name.content, decorator.parameters);
    }
    this.functionNameToken = functionNameToken;
    this.name = name;
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
  public getFunctionType(rootTypeTreeNode: TypeTreeNode): FunctionType {
    const argTypes = this.argumentDeclarations.map((a) => a.type.type as IType);
    const resultDeclaration = this.resultDeclaration;
    const resultType = resultDeclaration !== undefined ? (resultDeclaration.type.type || new VoidType(rootTypeTreeNode)) : new VoidType(rootTypeTreeNode);
    return new FunctionType(rootTypeTreeNode, argTypes, resultType, undefined);
  }
}
