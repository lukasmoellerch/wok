export interface ICompilationUnit {
  globalMutableGlobals: IGLobalMutableGlobal[];
  externalFunctionDeclarations: IExternalFunctionDeclaration[];
  internalFunctionDeclarations: IInternalFunctionDeclaration[];
  functionCode: IInternalFunctionDefinition[];
}
export enum Type {
  ui32,
  si32,
  ui64,
  si64,
  f32,
  f64,
  ptr,
  funcptr,
}
export interface IGLobalMutableGlobal {
  identifier: GlobalIdentifier;
  type: Type;
}
export interface IInternalFunctionDeclaration {
  identifier: FunctionIdentifier;
  type: FunctionType;
  inlinable: boolean;
  exportedAs?: string;
  tableElement: boolean;
  globalStateMutating: boolean;
}
export interface IExternalFunctionDeclaration {
  identifier: FunctionIdentifier;
  externalName: string;
  type: FunctionType;
}
export interface IInternalFunctionDefinition {
  identifier: FunctionIdentifier;
  variableTypes: Type[];
  code: Block[];
}
export enum InstructionType {
  phi,
  break,
  breakIf,
  breakIfFalse,
  call,
  callFunctionPointer,
  setToConstant,
  setToFunction,
  setToGlobal,
  copy,
  load,
  store,
  convert,
  equalToZero,
  equal,
  notEqual,
  less,
  greater,
  lessEqual,
  greaterEqual,
  countLeadingZeroes,
  countTrailingZeroes,
  add,
  subtract,
  multiply,
  divide,
  remainder,
  and,
  or,
  xor,
  shiftLeft,
  shiftRight,
  rotateleft,
  rotateRight,
  absolute,
  negate,
  floor,
  truncate,
  nearest,
  sqrt,
  minimum,
  maximum,
}
export type FunctionType = [Type[], Type[]]; // arguments, results
export type Variable = number;
export type FunctionIdentifier = string;
export type GlobalIdentifier = string;
export type NumericConstant = number;
export type SSAStatement =
  [InstructionType.phi, Variable, Variable[]]
  | [InstructionType.break]
  | [InstructionType.breakIf, Variable]
  | [InstructionType.breakIfFalse, Variable]
  | [InstructionType.call, FunctionIdentifier, Variable[], Variable[]]
  | [InstructionType.callFunctionPointer, FunctionType, Variable, Variable[], Variable[]]
  | [InstructionType.setToConstant, Variable, NumericConstant]
  | [InstructionType.setToFunction, Variable, FunctionIdentifier]
  | [InstructionType.setToGlobal, Variable, GlobalIdentifier]
  | [InstructionType.copy, Variable, Variable]
  | [InstructionType.load, Variable, Variable, Type]
  | [InstructionType.store, Variable, Variable, Type]
  | [InstructionType.convert, Variable, Variable, Type]
  | [InstructionType.equalToZero, Variable, Variable]
  | [InstructionType.equal, Variable, Variable, Variable]
  | [InstructionType.notEqual, Variable, Variable, Variable]
  | [InstructionType.less, Variable, Variable, Variable]
  | [InstructionType.greater, Variable, Variable, Variable]
  | [InstructionType.lessEqual, Variable, Variable, Variable]
  | [InstructionType.greaterEqual, Variable, Variable, Variable]
  | [InstructionType.countLeadingZeroes, Variable, Variable]
  | [InstructionType.countTrailingZeroes, Variable, Variable]
  | [InstructionType.add, Variable, Variable, Variable]
  | [InstructionType.subtract, Variable, Variable, Variable]
  | [InstructionType.multiply, Variable, Variable, Variable]
  | [InstructionType.divide, Variable, Variable, Variable]
  | [InstructionType.remainder, Variable, Variable, Variable]
  | [InstructionType.and, Variable, Variable, Variable]
  | [InstructionType.or, Variable, Variable, Variable]
  | [InstructionType.xor, Variable, Variable, Variable]
  | [InstructionType.shiftLeft, Variable, Variable]
  | [InstructionType.shiftRight, Variable, Variable]
  | [InstructionType.rotateleft, Variable, Variable]
  | [InstructionType.rotateRight, Variable, Variable]
  | [InstructionType.absolute, Variable, Variable]
  | [InstructionType.negate, Variable, Variable]
  | [InstructionType.floor, Variable, Variable]
  | [InstructionType.truncate, Variable, Variable]
  | [InstructionType.nearest, Variable, Variable]
  | [InstructionType.sqrt, Variable, Variable]
  | [InstructionType.minimum, Variable, Variable, Variable]
  | [InstructionType.maximum, Variable, Variable, Variable];
export enum BlockType {
  basic,
  loop,
  breakble,
}
export type Block = IBasicBlock | ILoopBlock | IBreakableBlock;
export interface IBasicBlock {
  type: BlockType.basic;
  statements: SSAStatement[];
}
export interface ILoopBlock {
  type: BlockType.loop;
  blocks: Block[];
}
export interface IBreakableBlock {
  type: BlockType.breakble;
  blocks: Block[];
}
