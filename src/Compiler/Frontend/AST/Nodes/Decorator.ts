import { Token } from "../../Lexer/Token";
import { ASTNode } from "../ASTNode";
import { ExpressionWrapper } from "./ExpressionWrapper";

export class Decorator extends ASTNode {
  public name = "Decorator";
  public nameToken: Token;
  public parameters: ExpressionWrapper[];
  constructor(nameToken: Token, parameters: ExpressionWrapper[]) {
    super();
    this.nameToken = nameToken;
    this.parameters = parameters;
    this.children = [nameToken, ...parameters];
  }

}
