import * as chalk from "chalk";
import { SourceRange } from "../Lexer/SourceRange";
import { TokenContentAttribute } from "./Attributes/TokenContentAttribute";
import { TypeAttribute } from "./Attributes/TypeAttribute";
import { VariableScopeEntryAttribute } from "./Attributes/VariableScopeEntryAttribute";
const astNodeNameStyle = chalk.default.red;

export interface IASTNode {
  name: string;
  attributes: Map<keyof IAttributeMap, IAttribute>;
  children: IASTNode[];
  range: SourceRange;
  toString(prefix: string, first: boolean, last: boolean): string;
}
interface IAttributeMap {
  type: TypeAttribute;
  tokenContent: TokenContentAttribute;
  variableScopeEntry: VariableScopeEntryAttribute;
}
export interface IAttribute {
  kind: keyof IAttributeMap;
  toString(): string;
}
export class ASTNode implements IASTNode {
  public name = "ASTNode";
  public attributes: Map<keyof IAttributeMap, IAttribute> = new Map();
  public children: IASTNode[] = [];
  public getAttribute<T extends keyof IAttributeMap>(kind: T): IAttributeMap[T] {
    const attribute = this.attributes.get(kind);
    if (attribute === undefined) {
      throw new Error("Attribute with specified name was not found");
    }
    return attribute as IAttributeMap[T];
  }
  public setAttribute(attribute: IAttribute) {
    this.attributes.set(attribute.kind, attribute);
  }
  public deleteAttribute<T extends keyof IAttributeMap>(kind: T) {
    this.attributes.delete(kind);
  }
  public get range(): SourceRange {
    const start = this.children[0].range.start;
    const end = this.children[this.children.length - 1].range.end;
    return new SourceRange(start, end);
  }
  public toString(prefix: string = "", first: boolean = true, last: boolean = true): string {
    let str = "";
    str += prefix;

    let newPrefix = prefix;
    if (last) {
      newPrefix += "   ";
      if (this.children.length > 0) {
        if (first) {
          str += " └─ ";
        } else {
          str += " └─ ";
        }
      } else {
        str += " └─ ";
      }

    } else {
      newPrefix += " │  ";
      if (this.children.length > 0) {
        if (first) {
          str += " ├─ ";
        } else {
          str += " ├─ ";
        }

      } else {
        str += " ├─ ";
      }
    }

    str += this.name;

    str += " ";
    for (const attribute of this.attributes.values()) {
      str += attribute.toString();
      str += " ";
    }

    str += "\n";

    let i = 0;
    for (const child of this.children) {
      str += child.toString(newPrefix, i === 0, i === (this.children.length - 1));
      i++;
    }
    return str;
  }
}
