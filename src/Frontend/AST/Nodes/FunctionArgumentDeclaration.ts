import { Token } from "../../Lexer/Token";
import { ASTNode } from "../ASTNode";
import { SpecializedTypeReference } from "./SpecializedTypeReference";
export class FunctionArgumentDeclaration extends ASTNode {
  public name: Token;
  public type: SpecializedTypeReference;
  constructor(name: Token, type: SpecializedTypeReference) {
    super();
    this.name = name;
    this.type = type;
    this.children = [type];
  }
}
