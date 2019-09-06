import { Token } from "../../Lexer/Token";
import { ASTNode } from "../ASTNode";
import { ConstantFieldDeclaration } from "./ConstantFieldDeclaration";
import { VariableFieldDeclaration } from "./VariableFieldDeclaration";

export type Declaration = ConstantFieldDeclaration | VariableFieldDeclaration;
export class DeclarationBlock extends ASTNode {
  public startToken: Token;
  public endToken: Token;
  public declarations: Declaration[];
  constructor(startToken: Token, declarations: Declaration[], endToken: Token) {
    super();
    this.startToken = startToken;
    this.declarations = declarations;
    this.endToken = endToken;
    this.children = [startToken, ...declarations, endToken];
  }
}
