export class SourceLocation {
  public sourcePath: string;
  public sourceContent: string;
  public offset: number;
  public line: number;
  public column: number;
  constructor(sourcePath: string, sourceContent: string, offset: number, line: number, column: number) {
    this.sourcePath = sourcePath;
    this.sourceContent = sourceContent;
    this.offset = offset;
    this.line = line;
    this.column = column;
  }
}
