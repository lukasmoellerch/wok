import { Token } from "../../Lexer/Token";
import { Block } from "./Block";
import { ExpressionWrapper } from "./ExpressionWrapper";
import { Statement } from "./Statement";

export class IfElseStatement extends Statement {
  public ifKeyword: Token;
  public condition: ExpressionWrapper;
  public trueBlock: Block;
  public elseKeyword: Token;
  public falseBlocK: Block;
  constructor(ifKeyword: Token, condition: ExpressionWrapper, trueBlock: Block, elseKeyword: Token, falseBlock: Block) {
    super();
    this.ifKeyword = ifKeyword;
    this.condition = condition;
    this.trueBlock = trueBlock;
    this.elseKeyword = elseKeyword;
    this.falseBlocK = falseBlock;
    this.children = [ifKeyword, condition, trueBlock, elseKeyword, falseBlock];
  }
}
