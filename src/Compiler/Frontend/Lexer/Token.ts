import { ASTNode } from "../AST/ASTNode";
import { TokenContentAttribute } from "../AST/Attributes/TokenContentAttribute";
import { SourceRange } from "./SourceRange";
import { TokenTag } from "./TokenTag";

export class Token extends ASTNode {
  public tag: TokenTag;
  public content: string;
  public sr: SourceRange;
  public get range(): SourceRange {
    return this.sr;
  }
  constructor(tag: TokenTag, content: string, sr: SourceRange) {
    super();
    this.tag = tag;
    this.content = content;
    this.sr = sr;
    this.setAttribute(new TokenContentAttribute(this));
  }
}
