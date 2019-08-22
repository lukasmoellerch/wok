import chalk from "chalk";
import { VariableScopeEntry, VariableScopeEntryType } from "../../VariableScope/VariableScope";
import { IAttribute } from "../ASTNode";

export class VariableScopeEntryAttribute implements IAttribute {
  public kind: "variableScopeEntry" = "variableScopeEntry";
  public entry: VariableScopeEntry;
  constructor(entry: VariableScopeEntry) {
    this.entry = entry;
  }
  public toString(): string {
    const type = this.entry.type;
    if (type === undefined) {
      return chalk.magenta(this.entry.index + " " + VariableScopeEntryType[this.entry.entryType]);
    } else {
      return chalk.magenta(this.entry.index + " " + VariableScopeEntryType[this.entry.entryType] + " " + type.stringifyType());
    }
  }

}
