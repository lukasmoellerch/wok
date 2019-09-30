import { Token } from "../../Lexer/Token";
import { IType } from "../../Type/Type";
import { VariableScopeEntry } from "../../VariableScope/VariableScope";
import { ILValue } from "../AST";
import { VariableScopeEntryAttribute } from "../Attributes/VariableScopeEntryAttribute";
import { Expression } from "./Expression";

export class VariableReferenceExpression extends Expression implements ILValue {
  public rhsType: IType | undefined;
  public lvalue: undefined = undefined;
  public variableToken: Token;
  public entry: VariableScopeEntry | undefined;
  constructor(variableToken: Token) {
    super();
    this.variableToken = variableToken;
    this.children = [variableToken];
  }
  public resolveToEntry(entry: VariableScopeEntry) {
    this.entry = entry;
    this.setAttribute(new VariableScopeEntryAttribute(entry));
  }
}
