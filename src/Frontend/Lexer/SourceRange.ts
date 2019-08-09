import { SourceLocation } from "./SourceLocation";
export class SourceRange {
  public start: SourceLocation;
  public end: SourceLocation;
  constructor(start: SourceLocation, end: SourceLocation) {
    this.start = start;
    this.end = end;
  }
}
