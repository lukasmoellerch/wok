import { IFunctionType } from "./AST";
export function functionTypesAreEqual(lhs: IFunctionType, rhs: IFunctionType): boolean {
  if (lhs.arguments.length !== rhs.arguments.length) {
    return false;
  }
  if (lhs.results.length !== rhs.results.length) {
    return false;
  }
  for (let i = 0; i < lhs.arguments.length; i++) {
    if (lhs.arguments[i] !== rhs.arguments[i]) {
      return false;
    }
  }
  for (let i = 0; i < lhs.results.length; i++) {
    if (lhs.results[i] !== rhs.results[i]) {
      return false;
    }
  }
  return true;
}
