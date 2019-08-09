export class SourceLocation {
  public sourcePath: string;
  public offset: number;
  public line: number;
  public column: number;
  constructor(sourcePath: string, offset: number, line: number, column: number) {
    this.sourcePath = sourcePath;
    this.offset = offset;
    this.line = line;
    this.column = column;
  }
}
