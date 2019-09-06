import { ValueType } from "../WASM/Encoding/Constants";
import { Block, BlockType, FunctionType, ICompilationUnit, InstructionType, SSAStatement, Type, Variable } from "./AST";
export function isPhiNode(statement: SSAStatement): boolean {
  return statement[0] === InstructionType.phi;
}
export function getAllPhiNodes(out: Array<[Variable, Variable[]]>, blocks: Block[]) {
  for (const statement of getStatementsInLinearOrder(blocks)) {
    if (statement[0] === InstructionType.phi) {
      const [write, read] = [statement[1], statement[2]];
      out.push([write, read]);
    }
  }
}
export function getStatementsInLinearOrder(blocks: Block[]): SSAStatement[] {
  let statements: SSAStatement[] = [];
  for (const block of blocks) {
    if (block.type === BlockType.basic) {
      statements = statements.concat(block.statements);
    } else if (block.type === BlockType.breakable) {
      statements = statements.concat(getStatementsInLinearOrder(block.blocks));
    } else if (block.type === BlockType.loop) {
      statements = statements.concat(getStatementsInLinearOrder(block.blocks));
    } else if (block.type === BlockType.if) {
      statements = statements.concat(getStatementsInLinearOrder(block.blocks));
    } else if (block.type === BlockType.ifelse) {
      statements = statements.concat(getStatementsInLinearOrder(block.true)).concat(getStatementsInLinearOrder(block.false));
    }
  }
  return statements;
}
export function isinteger(compilationUnit: ICompilationUnit, type: Type): boolean {
  return !isFloat(compilationUnit, type);
}
export function isFloat(compilationUnit: ICompilationUnit, type: Type): boolean {
  // To temporarily use compilationUnit
  if (compilationUnit.functionCode) { do { break; } while (true); }
  if (type === Type.f32) {
    return true;
  }
  if (type === Type.f64) {
    return true;
  }
  if (type === Type.si32) {
    return false;
  }
  if (type === Type.ui32) {
    return false;
  }
  if (type === Type.si64) {
    return false;
  }
  if (type === Type.ui64) {
    return false;
  }
  if (type === Type.funcptr) {
    return false;
  }
  if (type === Type.ptr) {
    return false;
  }
  return false;
}
export function isUnsigned(compilationUnit: ICompilationUnit, type: Type): boolean {
  return !isSigned(compilationUnit, type);
}
export function isSigned(compilationUnit: ICompilationUnit, type: Type): boolean {
  // To temporarily use compilationUnit
  if (compilationUnit.functionCode) { do { break; } while (true); }
  if (type === Type.f32) {
    return true;
  }
  if (type === Type.f64) {
    return true;
  }
  if (type === Type.si32) {
    return true;
  }
  if (type === Type.ui32) {
    return false;
  }
  if (type === Type.si64) {
    return true;
  }
  if (type === Type.ui64) {
    return false;
  }
  if (type === Type.funcptr) {
    return false;
  }
  if (type === Type.ptr) {
    return false;
  }
  return false;
}
export function mapIRTypeToWasm(compilationUnit: ICompilationUnit, type: Type): ValueType {
  // To temporarily use compilationUnit
  if (compilationUnit.functionCode) { do { break; } while (true); }
  if (type === Type.f32) {
    return ValueType.f32;
  }
  if (type === Type.f64) {
    return ValueType.f64;
  }
  if (type === Type.si32) {
    return ValueType.i32;
  }
  if (type === Type.ui32) {
    return ValueType.i32;
  }
  if (type === Type.si64) {
    return ValueType.i64;
  }
  if (type === Type.ui64) {
    return ValueType.i64;
  }
  if (type === Type.funcptr) {
    return ValueType.i32;
  }
  if (type === Type.ptr) {
    return ValueType.i32;
  }
  return ValueType.i32;
}
export function getWrittenVariables(statement: SSAStatement): Variable[] {
  if (statement[0] === InstructionType.phi) {
    return [statement[1]];
  }
  if (statement[0] === InstructionType.break) {
    return [];
  }
  if (statement[0] === InstructionType.breakIf) {
    return [];
  }
  if (statement[0] === InstructionType.breakIfFalse) {
    return [];
  }
  if (statement[0] === InstructionType.call) {
    return statement[2];
  }
  if (statement[0] === InstructionType.callFunctionPointer) {
    return statement[3];
  }
  if (statement[0] === InstructionType.setToConstant) {
    return [statement[1]];
  }
  if (statement[0] === InstructionType.setToFunction) {
    return [statement[1]];
  }
  if (statement[0] === InstructionType.setToGlobal) {
    return [statement[1]];
  }
  if (statement[0] === InstructionType.setToDataSegment) {
    return [statement[1]];
  }
  if (statement[0] === InstructionType.copy) {
    return [statement[1]];
  }
  if (statement[0] === InstructionType.load) {
    return [statement[1]];
  }
  if (statement[0] === InstructionType.store) {
    return [];
  }
  if (statement[0] === InstructionType.convert) {
    return [statement[1]];
  }
  if (statement[0] === InstructionType.equalToZero) {
    return [statement[1]];
  }
  if (statement[0] === InstructionType.equal) {
    return [statement[1]];
  }
  if (statement[0] === InstructionType.notEqual) {
    return [statement[1]];
  }
  if (statement[0] === InstructionType.less) {
    return [statement[1]];
  }
  if (statement[0] === InstructionType.greater) {
    return [statement[1]];
  }
  if (statement[0] === InstructionType.lessEqual) {
    return [statement[1]];
  }
  if (statement[0] === InstructionType.greaterEqual) {
    return [statement[1]];
  }
  if (statement[0] === InstructionType.countLeadingZeroes) {
    return [statement[1]];
  }
  if (statement[0] === InstructionType.countTrailingZeroes) {
    return [statement[1]];
  }
  if (statement[0] === InstructionType.add) {
    return [statement[1]];
  }
  if (statement[0] === InstructionType.subtract) {
    return [statement[1]];
  }
  if (statement[0] === InstructionType.multiply) {
    return [statement[1]];
  }
  if (statement[0] === InstructionType.divide) {
    return [statement[1]];
  }
  if (statement[0] === InstructionType.remainder) {
    return [statement[1]];
  }
  if (statement[0] === InstructionType.and) {
    return [statement[1]];
  }
  if (statement[0] === InstructionType.or) {
    return [statement[1]];
  }
  if (statement[0] === InstructionType.xor) {
    return [statement[1]];
  }
  if (statement[0] === InstructionType.shiftLeft) {
    return [statement[1]];
  }
  if (statement[0] === InstructionType.shiftRight) {
    return [statement[1]];
  }
  if (statement[0] === InstructionType.rotateleft) {
    return [statement[1]];
  }
  if (statement[0] === InstructionType.rotateRight) {
    return [statement[1]];
  }
  if (statement[0] === InstructionType.absolute) {
    return [statement[1]];
  }
  if (statement[0] === InstructionType.negate) {
    return [statement[1]];
  }
  if (statement[0] === InstructionType.floor) {
    return [statement[1]];
  }
  if (statement[0] === InstructionType.truncate) {
    return [statement[1]];
  }
  if (statement[0] === InstructionType.nearest) {
    return [statement[1]];
  }
  if (statement[0] === InstructionType.sqrt) {
    return [statement[1]];
  }
  if (statement[0] === InstructionType.minimum) {
    return [statement[1]];
  }
  if (statement[0] === InstructionType.maximum) {
    return [statement[1]];
  }
  if (statement[0] === InstructionType.return) {
    return [];
  }
  return [];
}
export function isBreakStatement(statement: SSAStatement): boolean {
  if (statement[0] === InstructionType.break) {
    return true;
  }
  if (statement[0] === InstructionType.breakIf) {
    return true;
  }
  if (statement[0] === InstructionType.breakIfFalse) {
    return true;
  }
  return false;
}
export function getReadVariables(statement: SSAStatement): Variable[] {
  if (statement[0] === InstructionType.phi) {
    return statement[2];
  }
  if (statement[0] === InstructionType.break) {
    return [];
  }
  if (statement[0] === InstructionType.breakIf) {
    return [statement[1]];
  }
  if (statement[0] === InstructionType.breakIfFalse) {
    return [statement[1]];
  }
  if (statement[0] === InstructionType.call) {
    return statement[3];
  }
  if (statement[0] === InstructionType.callFunctionPointer) {
    return statement[4];
  }
  if (statement[0] === InstructionType.setToConstant) {
    return [];
  }
  if (statement[0] === InstructionType.setToFunction) {
    return [];
  }
  if (statement[0] === InstructionType.setToGlobal) {
    return [];
  }
  if (statement[0] === InstructionType.setToDataSegment) {
    return [];
  }
  if (statement[0] === InstructionType.copy) {
    return [statement[2]];
  }
  if (statement[0] === InstructionType.load) {
    return [statement[2]];
  }
  if (statement[0] === InstructionType.store) {
    return [statement[1], statement[2]];
  }
  if (statement[0] === InstructionType.convert) {
    return [statement[2]];
  }
  if (statement[0] === InstructionType.equalToZero) {
    return [statement[2]];
  }
  if (statement[0] === InstructionType.equal) {
    return [statement[2], statement[3]];
  }
  if (statement[0] === InstructionType.notEqual) {
    return [statement[2], statement[3]];
  }
  if (statement[0] === InstructionType.less) {
    return [statement[2], statement[3]];
  }
  if (statement[0] === InstructionType.greater) {
    return [statement[2], statement[3]];
  }
  if (statement[0] === InstructionType.lessEqual) {
    return [statement[2], statement[3]];
  }
  if (statement[0] === InstructionType.greaterEqual) {
    return [statement[2], statement[3]];
  }
  if (statement[0] === InstructionType.countLeadingZeroes) {
    return [statement[2]];
  }
  if (statement[0] === InstructionType.countTrailingZeroes) {
    return [statement[2]];
  }
  if (statement[0] === InstructionType.add) {
    return [statement[2], statement[3]];
  }
  if (statement[0] === InstructionType.subtract) {
    return [statement[2], statement[3]];
  }
  if (statement[0] === InstructionType.multiply) {
    return [statement[2], statement[3]];
  }
  if (statement[0] === InstructionType.divide) {
    return [statement[2], statement[3]];
  }
  if (statement[0] === InstructionType.remainder) {
    return [statement[2], statement[3]];
  }
  if (statement[0] === InstructionType.and) {
    return [statement[2], statement[3]];
  }
  if (statement[0] === InstructionType.or) {
    return [statement[2], statement[3]];
  }
  if (statement[0] === InstructionType.xor) {
    return [statement[2], statement[3]];
  }
  if (statement[0] === InstructionType.shiftLeft) {
    return [statement[2]];
  }
  if (statement[0] === InstructionType.shiftRight) {
    return [statement[2]];
  }
  if (statement[0] === InstructionType.rotateleft) {
    return [statement[2]];
  }
  if (statement[0] === InstructionType.rotateRight) {
    return [statement[2]];
  }
  if (statement[0] === InstructionType.absolute) {
    return [statement[2]];
  }
  if (statement[0] === InstructionType.negate) {
    return [statement[2]];
  }
  if (statement[0] === InstructionType.floor) {
    return [statement[2]];
  }
  if (statement[0] === InstructionType.truncate) {
    return [statement[2]];
  }
  if (statement[0] === InstructionType.nearest) {
    return [statement[2]];
  }
  if (statement[0] === InstructionType.sqrt) {
    return [statement[2]];
  }
  if (statement[0] === InstructionType.minimum) {
    return [statement[2], statement[3]];
  }
  if (statement[0] === InstructionType.maximum) {
    return [statement[2], statement[3]];
  }
  if (statement[0] === InstructionType.return) {
    return statement[1];
  }
  return [];
}
export function numberArrayContentsAreEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let i = 0;
  while (i < a.length) {
    if (a[i] !== b[i]) {
      return false;
    }
    i++;
  }
  return true;
}
export function irFunctionTypesAreEqual(a: FunctionType, b: FunctionType): boolean {
  return numberArrayContentsAreEqual(a[0], b[0]) &&
    numberArrayContentsAreEqual(a[1], b[1]);
}

export function mapWrittenVariables(statement: SSAStatement, fn: ((arg0: number) => number)): SSAStatement {
  if (statement[0] === InstructionType.phi) {
    return [statement[0], fn(statement[1]), statement[2]];
  }
  if (statement[0] === InstructionType.break) {
    return [statement[0]];
  }
  if (statement[0] === InstructionType.breakIf) {
    return [statement[0], statement[1]];
  }
  if (statement[0] === InstructionType.breakIfFalse) {
    return [statement[0], statement[1]];
  }
  if (statement[0] === InstructionType.call) {
    return [statement[0], statement[1], statement[2].map((a) => fn(a)), statement[3]];
  }
  if (statement[0] === InstructionType.callFunctionPointer) {
    return [statement[0], statement[1], statement[2], statement[3].map((a) => fn(a)), statement[4]];
  }
  if (statement[0] === InstructionType.setToConstant) {
    return [statement[0], fn(statement[1]), statement[2]];
  }
  if (statement[0] === InstructionType.setToFunction) {
    return [statement[0], fn(statement[1]), statement[2]];
  }
  if (statement[0] === InstructionType.setToGlobal) {
    return [statement[0], fn(statement[1]), statement[2]];
  }
  if (statement[0] === InstructionType.setToDataSegment) {
    return [statement[0], fn(statement[1]), statement[2]];
  }
  if (statement[0] === InstructionType.copy) {
    return [statement[0], fn(statement[1]), statement[2]];
  }
  if (statement[0] === InstructionType.load) {
    return [statement[0], fn(statement[1]), statement[2], statement[3]];
  }
  if (statement[0] === InstructionType.store) {
    return [statement[0], statement[1], statement[2], statement[3]];
  }
  if (statement[0] === InstructionType.convert) {
    return [statement[0], fn(statement[1]), statement[2], statement[3]];
  }
  if (statement[0] === InstructionType.equalToZero) {
    return [statement[0], fn(statement[1]), statement[2]];
  }
  if (statement[0] === InstructionType.equal) {
    return [statement[0], fn(statement[1]), statement[2], statement[3]];
  }
  if (statement[0] === InstructionType.notEqual) {
    return [statement[0], fn(statement[1]), statement[2], statement[3]];
  }
  if (statement[0] === InstructionType.less) {
    return [statement[0], fn(statement[1]), statement[2], statement[3]];
  }
  if (statement[0] === InstructionType.greater) {
    return [statement[0], fn(statement[1]), statement[2], statement[3]];
  }
  if (statement[0] === InstructionType.lessEqual) {
    return [statement[0], fn(statement[1]), statement[2], statement[3]];
  }
  if (statement[0] === InstructionType.greaterEqual) {
    return [statement[0], fn(statement[1]), statement[2], statement[3]];
  }
  if (statement[0] === InstructionType.countLeadingZeroes) {
    return [statement[0], fn(statement[1]), statement[2]];
  }
  if (statement[0] === InstructionType.countTrailingZeroes) {
    return [statement[0], fn(statement[1]), statement[2]];
  }
  if (statement[0] === InstructionType.add) {
    return [statement[0], fn(statement[1]), statement[2], statement[3]];
  }
  if (statement[0] === InstructionType.subtract) {
    return [statement[0], fn(statement[1]), statement[2], statement[3]];
  }
  if (statement[0] === InstructionType.multiply) {
    return [statement[0], fn(statement[1]), statement[2], statement[3]];
  }
  if (statement[0] === InstructionType.divide) {
    return [statement[0], fn(statement[1]), statement[2], statement[3]];
  }
  if (statement[0] === InstructionType.remainder) {
    return [statement[0], fn(statement[1]), statement[2], statement[3]];
  }
  if (statement[0] === InstructionType.and) {
    return [statement[0], fn(statement[1]), statement[2], statement[3]];
  }
  if (statement[0] === InstructionType.or) {
    return [statement[0], fn(statement[1]), statement[2], statement[3]];
  }
  if (statement[0] === InstructionType.xor) {
    return [statement[0], fn(statement[1]), statement[2], statement[3]];
  }
  if (statement[0] === InstructionType.shiftLeft) {
    return [statement[0], fn(statement[1]), statement[2], statement[3]];
  }
  if (statement[0] === InstructionType.shiftRight) {
    return [statement[0], fn(statement[1]), statement[2], statement[3]];
  }
  if (statement[0] === InstructionType.rotateleft) {
    return [statement[0], fn(statement[1]), statement[2], statement[3]];
  }
  if (statement[0] === InstructionType.rotateRight) {
    return [statement[0], fn(statement[1]), statement[2], statement[3]];
  }
  if (statement[0] === InstructionType.absolute) {
    return [statement[0], fn(statement[1]), statement[2]];
  }
  if (statement[0] === InstructionType.negate) {
    return [statement[0], fn(statement[1]), statement[2]];
  }
  if (statement[0] === InstructionType.floor) {
    return [statement[0], fn(statement[1]), statement[2]];
  }
  if (statement[0] === InstructionType.truncate) {
    return [statement[0], fn(statement[1]), statement[2]];
  }
  if (statement[0] === InstructionType.nearest) {
    return [statement[0], fn(statement[1]), statement[2]];
  }
  if (statement[0] === InstructionType.sqrt) {
    return [statement[0], fn(statement[1]), statement[2]];
  }
  if (statement[0] === InstructionType.minimum) {
    return [statement[0], fn(statement[1]), statement[2], statement[3]];
  }
  if (statement[0] === InstructionType.maximum) {
    return [statement[0], fn(statement[1]), statement[2], statement[3]];
  }
  if (statement[0] === InstructionType.return) {
    return [statement[0], statement[1]];
  }
  throw new Error();
}
export function mapReadVariables(statement: SSAStatement, map: ((arg: number) => number)): SSAStatement {
  if (statement[0] === InstructionType.phi) {
    return [statement[0], statement[1], statement[2].map((a) => map(a))];
  }
  if (statement[0] === InstructionType.break) {
    return [statement[0]];
  }
  if (statement[0] === InstructionType.breakIf) {
    return [statement[0], map(statement[1])];
  }
  if (statement[0] === InstructionType.breakIfFalse) {
    return [statement[0], map(statement[1])];
  }
  if (statement[0] === InstructionType.call) {
    return [statement[0], statement[1], statement[2], statement[3].map((a) => map(a))];
  }
  if (statement[0] === InstructionType.callFunctionPointer) {
    return [statement[0], statement[1], map(statement[2]), statement[3], statement[4].map((a) => map(a))];
  }
  if (statement[0] === InstructionType.setToConstant) {
    return [statement[0], statement[1], statement[2]];
  }
  if (statement[0] === InstructionType.setToFunction) {
    return [statement[0], statement[1], statement[2]];
  }
  if (statement[0] === InstructionType.setToGlobal) {
    return [statement[0], statement[1], statement[2]];
  }
  if (statement[0] === InstructionType.setToDataSegment) {
    return [statement[0], statement[1], statement[2]];
  }
  if (statement[0] === InstructionType.copy) {
    return [statement[0], statement[1], map(statement[2])];
  }
  if (statement[0] === InstructionType.load) {
    return [statement[0], statement[1], map(statement[2]), map(statement[3])];
  }
  if (statement[0] === InstructionType.store) {
    return [statement[0], map(statement[1]), map(statement[2]), map(statement[3])];
  }
  if (statement[0] === InstructionType.convert) {
    return [statement[0], statement[1], map(statement[2]), statement[3]];
  }
  if (statement[0] === InstructionType.equalToZero) {
    return [statement[0], statement[1], map(statement[2])];
  }
  if (statement[0] === InstructionType.equal) {
    return [statement[0], statement[1], map(statement[2]), map(statement[3])];
  }
  if (statement[0] === InstructionType.notEqual) {
    return [statement[0], statement[1], map(statement[2]), map(statement[3])];
  }
  if (statement[0] === InstructionType.less) {
    return [statement[0], statement[1], map(statement[2]), map(statement[3])];
  }
  if (statement[0] === InstructionType.greater) {
    return [statement[0], statement[1], map(statement[2]), map(statement[3])];
  }
  if (statement[0] === InstructionType.lessEqual) {
    return [statement[0], statement[1], map(statement[2]), map(statement[3])];
  }
  if (statement[0] === InstructionType.greaterEqual) {
    return [statement[0], statement[1], map(statement[2]), map(statement[3])];
  }
  if (statement[0] === InstructionType.countLeadingZeroes) {
    return [statement[0], statement[1], map(statement[2])];
  }
  if (statement[0] === InstructionType.countTrailingZeroes) {
    return [statement[0], statement[1], map(statement[2])];
  }
  if (statement[0] === InstructionType.add) {
    return [statement[0], statement[1], map(statement[2]), map(statement[3])];
  }
  if (statement[0] === InstructionType.subtract) {
    return [statement[0], statement[1], map(statement[2]), map(statement[3])];
  }
  if (statement[0] === InstructionType.multiply) {
    return [statement[0], statement[1], map(statement[2]), map(statement[3])];
  }
  if (statement[0] === InstructionType.divide) {
    return [statement[0], statement[1], map(statement[2]), map(statement[3])];
  }
  if (statement[0] === InstructionType.remainder) {
    return [statement[0], statement[1], map(statement[2]), map(statement[3])];
  }
  if (statement[0] === InstructionType.and) {
    return [statement[0], statement[1], map(statement[2]), map(statement[3])];
  }
  if (statement[0] === InstructionType.or) {
    return [statement[0], statement[1], map(statement[2]), map(statement[3])];
  }
  if (statement[0] === InstructionType.xor) {
    return [statement[0], statement[1], map(statement[2]), map(statement[3])];
  }
  if (statement[0] === InstructionType.shiftLeft) {
    return [statement[0], statement[1], map(statement[2]), map(statement[3])];
  }
  if (statement[0] === InstructionType.shiftRight) {
    return [statement[0], statement[1], map(statement[2]), map(statement[3])];
  }
  if (statement[0] === InstructionType.rotateleft) {
    return [statement[0], statement[1], map(statement[2]), map(statement[3])];
  }
  if (statement[0] === InstructionType.rotateRight) {
    return [statement[0], statement[1], map(statement[2]), map(statement[3])];
  }
  if (statement[0] === InstructionType.absolute) {
    return [statement[0], statement[1], map(statement[2])];
  }
  if (statement[0] === InstructionType.negate) {
    return [statement[0], statement[1], map(statement[2])];
  }
  if (statement[0] === InstructionType.floor) {
    return [statement[0], statement[1], map(statement[2])];
  }
  if (statement[0] === InstructionType.truncate) {
    return [statement[0], statement[1], map(statement[2])];
  }
  if (statement[0] === InstructionType.nearest) {
    return [statement[0], statement[1], map(statement[2])];
  }
  if (statement[0] === InstructionType.sqrt) {
    return [statement[0], statement[1], map(statement[2])];
  }
  if (statement[0] === InstructionType.minimum) {
    return [statement[0], statement[1], map(statement[2]), map(statement[3])];
  }
  if (statement[0] === InstructionType.maximum) {
    return [statement[0], statement[1], map(statement[2]), map(statement[3])];
  }
  if (statement[0] === InstructionType.return) {
    return [statement[0], statement[1].map((a) => map(a))];
  }
  throw new Error();
}