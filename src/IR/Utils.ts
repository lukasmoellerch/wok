import { ValueType } from "../WASM/Encoding/Constants";
import { Block, BlockType, ICompilationUnit, InstructionType, SSAStatement, Type, Variable } from "./AST";
export function isPhiNode(statement: SSAStatement): boolean {
  return statement[0] === InstructionType.phi;
}
export function getStatementsInLinearOrder(blocks: Block[]): SSAStatement[] {
  let statements: SSAStatement[] = [];
  for (const block of blocks) {
    if (block.type === BlockType.basic) {
      statements = statements.concat(block.statements);
    } else {
      statements = statements.concat(getStatementsInLinearOrder(block.blocks));
    }
  }
  return statements;
}
export function mapIRTypeToWasm(compilationUnit: ICompilationUnit, type: Type): ValueType {
  if (type === Type.) {
    return ValueType.f32;
  }
  if (type) { }
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
  return [];
}
