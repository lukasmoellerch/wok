import { SourceLocation } from "./SourceLocation";
export class SourceRange {
  public start: SourceLocation;
  public end: SourceLocation;
  public sourcePath: string;
  public sourceContent: string;
  constructor(start: SourceLocation, end: SourceLocation) {
    this.start = start;
    this.end = end;
    this.sourcePath = start.sourcePath;
    this.sourceContent = start.sourceContent;
  }
}
