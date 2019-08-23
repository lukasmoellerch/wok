import { ASTNode } from "../AST/ASTNode";
import { TokenContentAttribute } from "../AST/Attributes/TokenContentAttribute";
import { SourceRange } from "./SourceRange";
import { TokenTag } from "./TokenTag";

export class Token extends ASTNode {
  public tag: TokenTag;
  public content: string;
  public range: SourceRange;
  constructor(tag: TokenTag, content: string, range: SourceRange) {
    super();
    this.tag = tag;
    this.content = content;
    this.range = range;
    this.setAttribute(new TokenContentAttribute(this));
  }
}
