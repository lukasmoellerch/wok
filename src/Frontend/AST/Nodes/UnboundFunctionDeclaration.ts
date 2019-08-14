import { Token } from "../../Lexer/Token";
import { ASTNode } from "../ASTNode";
import { Block } from "./Block";
import { FunctionArgumentDeclaration } from "./FunctionArgumentDeclaration";
export class UnboundFunctionDeclaration extends ASTNode {
  public name: Token;
  public argumentDeclarations: FunctionArgumentDeclaration[];
  public block: Block;
  constructor(name: Token, argumentDeclarations: FunctionArgumentDeclaration[], block: Block) {
    super();
    this.name = name;
    this.argumentDeclarations = argumentDeclarations;
    this.block = block;
    this.children = [...argumentDeclarations, block];
  }
}
