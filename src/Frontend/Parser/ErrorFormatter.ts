import chalk from "chalk";
import { IGroupedString, Lexer, TokenTagGroup } from "../Lexer/Lexer";
import { CompilerError } from "./ParserError";
export class ErrorFormatter {
  public lines: string[];
  public colorizedLines: string[];
  constructor(public sourceContent: string, public sourcePath: string, public errors: CompilerError[]) {
    this.lines = sourceContent.split(/[\r\n|\r|\n]/g);
    this.colorizedLines = this.lines.map((line) => {
      const lexer = new Lexer(sourcePath, line);
      return lexer.group().map(this.colorizeGroupedString).join("");
    });
  }
  public colorizeGroupedString(str: IGroupedString): string {
    const content = str.token.content;
    switch (str.group) {
      case TokenTagGroup.whitespace:
        return content;
      case TokenTagGroup.comment:
        return chalk.green(content);
      case TokenTagGroup.identifier:
        return chalk.bold(content);
      case TokenTagGroup.literal:
        return chalk.yellow(content);
      case TokenTagGroup.operator:
        return chalk.green(content);
      case TokenTagGroup.punctuation:
        return chalk.red(content);
      case TokenTagGroup.keyword:
        return chalk.blue(content);
      case TokenTagGroup.placeholder:
        return chalk.bgRed.bold.whiteBright(content);
    }
  }
  public toString(): string {
    let result = "";
    if (this.errors.length === 0) {
      result += chalk.bgGreenBright.black("No Errors were found\n") + "in: \"" + this.sourcePath + "\"" + "\n";
    } else if (this.errors.length === 1) {
      result += chalk.bgWhiteBright.red(this.errors.length + " Error:\n") + "in: \"" + this.sourcePath + "\"" + "\n";
    } else {
      result += chalk.bgWhiteBright.red(this.errors.length + " Errors:\n") + "in: \"" + this.sourcePath + "\"" + "\n";
    }

    const lineNumberingLength = 2;
    for (const error of this.errors.sort((a, b) => a.range.start.line - b.range.start.line)) {
      let index = error.range.start.line - 1;
      while (index <= (error.range.end.line - 1)) {
        const lineNumbering = (index + 1).toString().padEnd(lineNumberingLength, " ") + " | ";
        result += lineNumbering + this.colorizedLines[index] + "\n";

        if (index === error.range.start.line - 1 && index === error.range.end.line - 1) {
          let line = "";
          for (let i = 1; i < error.range.start.column + lineNumberingLength + 4; i++) {
            line += " ";
          }
          let errorLength = error.range.end.column - error.range.start.column;
          errorLength = Math.max(1, errorLength);
          for (let i = 0; i < errorLength; i++) {
            line += "↑";
          }
          result += chalk.red(line) + "\n";
        }
        index++;
      }
      result += "🛑 " + error.toString() + "\n";
    }
    return result;
  }
}
