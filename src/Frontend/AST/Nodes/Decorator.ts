import { Token } from "../../Lexer/Token";
import { ASTNode } from "../ASTNode";
import { ExpressionWrapper } from "./ExpressionWrapper";

export class Decorator extends ASTNode {
  public name: Token;
  public parameters: ExpressionWrapper[];
  constructor(name: Token, parameters: ExpressionWrapper[]) {
    super();
    this.name = name;
    this.parameters = parameters;
    this.children = [name, ...parameters];
  }

}
