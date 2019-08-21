import { Token } from "../../Lexer/Token";
import { ILValue } from "../AST";
import { Expression } from "./Expression";
import { Statement } from "./Statement";

export class AssignmentStatement extends Statement {
  public target: ILValue;
  public assignmentOperator: Token;
  public value: Expression;
  constructor(target: ILValue, assignmentOperator: Token, value: Expression) {
    super();
    this.target = target;
    this.assignmentOperator = assignmentOperator;
    this.value = value;
  }
}
