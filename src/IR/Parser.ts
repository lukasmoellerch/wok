// @ts-ignore
import * as grammar from "../../dist/IR/grammar";
import { ICompilationUnit } from "./AST";
export function parse(input: string): ICompilationUnit {
  try {
    return grammar.parse(input) as ICompilationUnit;
  } catch (ex) {
    console.log(ex.location);
    throw ex as grammar.SyntaxError;
  }
}
