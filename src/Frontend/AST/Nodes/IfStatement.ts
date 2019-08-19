import { Token } from "../../Lexer/Token";
import { Block } from "./Block";
import { ExpressionWrapper } from "./EpxressionWrapper";
import { Statement } from "./Statement";

export class IfStatement extends Statement {
  public ifKeyword: Token;
  public condition: ExpressionWrapper;
  public block: Block;
  constructor(ifKeyword: Token, condition: ExpressionWrapper, block: Block) {
    super();
    this.ifKeyword = ifKeyword;
    this.condition = condition;
    this.block = block;
    this.children = [ifKeyword, condition, block];
  }
}
