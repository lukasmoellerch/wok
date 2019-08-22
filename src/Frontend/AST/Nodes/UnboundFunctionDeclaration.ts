import { Token } from "../../Lexer/Token";
import { VariableScopeEntry } from "../../VariableScope/VariableScope";
import { ITopLevelDeclaration } from "../AST";
import { ASTNode } from "../ASTNode";
import { Block } from "./Block";
import { FunctionArgumentDeclaration } from "./FunctionArgumentDeclaration";
export class UnboundFunctionDeclaration extends ASTNode implements ITopLevelDeclaration {
  public functionNameToken: Token;
  public topLevelDeclarable: void;
  public name: Token;
  public argumentDeclarations: FunctionArgumentDeclaration[];
  public block: Block;
  public variables: VariableScopeEntry[] = [];
  constructor(functionNameToken: Token, name: Token, argumentDeclarations: FunctionArgumentDeclaration[], block: Block) {
    super();
    this.functionNameToken = functionNameToken;
    this.name = name;
    this.argumentDeclarations = argumentDeclarations;
    this.block = block;
    this.children = [functionNameToken, name, ...argumentDeclarations, block];
  }
}
