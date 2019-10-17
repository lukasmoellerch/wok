import { Token } from "../../Lexer/Token";
import { VariableScopeEntry } from "../../VariableScope/VariableScope";
import { ILValue } from "../AST";
import { VariableScopeEntryAttribute } from "../Attributes/VariableScopeEntryAttribute";
import { ITypeCheckingType } from "../ExpressionType";
import { Expression } from "./Expression";

export class VariableReferenceExpression extends Expression implements ILValue {
  public name = "VariableReferenceExpression";
  public rhsType: ITypeCheckingType | undefined;
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
