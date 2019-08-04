// Module
export const magicString = "\0asm"; // uint32
export const version = 0x01; // uint32
// TODO: Make these dynamic
export const magicNumber = 0x0061_736d;
export const versionNumber = 0x0100_0000;
// Sections
export enum Section {
  custom = 0,
  type = 1,
  import = 2,
  function = 3,
  table = 4,
  memory = 5,
  global = 6,
  export = 7,
  start = 8,
  element = 9,
  code = 10,
  data = 11,
}
// Types
export enum ValueType {
  i32 = 0x7f,
  i64 = 0x7e,
  f32 = 0x7d,
  f64 = 0x7c,
}
export enum NonValueResultType {
  empty = 0x40,
}
export type ResultType = ValueType | NonValueResultType;
export const functionByte = 0x60;
export enum Limit {
  minimum = 0x00,
  minimumAndMaximum = 0x01,
}
export enum TableType {
  funcref = 0x70,
}
export enum GlobalTypeMutability {
  constant = 0x00,
  variable = 0x01,
}
// Instructions
export enum Instruction {
  // Control instructions
  unreachable = 0x00,
  nop = 0x01,
  blockstart = 0x02,
  loopstart = 0x03,
  ifstart = 0x04,
  else = 0x05,
  blockend = 0x0b, // Also is used to end loop and if blocks
  br = 0x0c,
  brIf = 0x0d,
  brTable = 0x0e,
  return = 0x0f,
  call = 0x10,
  callIndirect = 0x11,

  // Parametric Instructions
  drop = 0x1a,
  select = 0x1b,

  // Variable Instructions
  localGet = 0x20,
  localSet = 0x21,
  localTee = 0x22,
  globalGet = 0x23,
  globalSet = 0x24,

  // Memory instructions
  i32Load = 0x28,
  i64Load = 0x29,
  f32Load = 0x2a,
  f64Load = 0x2b,
  i32LoadS8 = 0x2c,
  i32LoadU8 = 0x2d,
  i32LoadS16 = 0x2e,
  i32LoadU16 = 0x2f,
  i64LoadS8 = 0x30,
  i64LoadU8 = 0x31,
  i64LoadS16 = 0x32,
  i64LoadU16 = 0x33,
  i64LoadS32 = 0x34,
  i64LoadU32 = 0x35,

  i32Store = 0x36,
  i64Store = 0x37,
  f32Store = 0x38,
  f64Store = 0x39,
  i32Store8 = 0x3a,
  i32Store16 = 0x3b,
  i64Store8 = 0x3c,
  i64Store16 = 0x3d,
  i64Store32 = 0x3e,
  memorySize = 0x3f, // 0x00
  memoryGrow = 0x40, // 0x00

  // Numeric Instructions
  i32Const = 0x41,
  i64Const = 0x42,
  f32Const = 0x43,
  f64Const = 0x44,

  i32EqualToZero = 0x45,
  i32Equal = 0x46,
  i32NotEqual = 0x47,
  i32SignedLess = 0x48,
  i32UnsignedLess = 0x49,
  i32SignedGreater = 0x4a,
  i32UnsignedGreater = 0x4b,
  i32SignedLessEqual = 0x4c,
  i32UnsignedLessEqual = 0x4d,
  i32SignedGreaterEqual = 0x4e,
  i32UnsignedGreaterEqual = 0x4f,

  i64EqualToZero = 0x50,
  i64Equal = 0x51,
  i64NotEqual = 0x52,
  i64SignedLess = 0x53,
  i64UnsignedLess = 0x54,
  i64SignedGreater = 0x55,
  i64UnsignedGreater = 0x56,
  i64SignedLessEqual = 0x57,
  i64UnsignedLessEqual = 0x58,
  i64SignedGreaterEqual = 0x59,
  i64UnsignedGreaterEqual = 0x5a,

  f32Equal = 0x5b,
  f32NotEqual = 0x5c,
  f32Less = 0x5d,
  f32Greater = 0x5e,
  f32LessEqual = 0x5f,
  f32GreaterEqual = 0x60,

  f64Equal = 0x61,
  f64NotEqual = 0x62,
  f64Less = 0x63,
  f64Greater = 0x64,
  f64LessEqual = 0x65,
  f64GreaterEqual = 0x66,

  i32CountLeadingZeroes = 0x67,
  i32CountTrailingZeroes = 0x68,
  i32PopCount = 0x69,
  i32Add = 0x6a,
  i32Subtract = 0x6b,
  i32Multiply = 0x6c,
  i32DivideSigned = 0x6d,
  i32DivideUnsigned = 0x6e,
  i32RemainderSigned = 0x6f,
  i32RemainderUnsigned = 0x70,
  i32And = 0x71,
  i32Or = 0x72,
  i32Xor = 0x73,
  i32ShiftLeft = 0x74,
  i32ShiftRightSigned = 0x75,
  i32ShiftRightUnsigned = 0x76,
  i32RotateLeft = 0x77,
  i32RotateRight = 0x78,

  i64CountLeadingZeroes = 0x79,
  i64CountTrailingZeroes = 0x7a,
  i64PopCount = 0x7b,
  i64Add = 0x7c,
  i64Subtract = 0x7d,
  i64Multiply = 0x7e,
  i64DivideSigned = 0x7f,
  i64DivideUnsigned = 0x80,
  i64RemainderSigned = 0x81,
  i64RemainderUnsigned = 0x82,
  i64And = 0x83,
  i64Or = 0x84,
  i64Xor = 0x85,
  i64ShiftLeft = 0x86,
  i64ShiftRightSigned = 0x87,
  i64ShiftRightUnsigned = 0x88,
  i64RotateLeft = 0x89,
  i64RotateRight = 0x8a,

  f32Absolute = 0x8b,
  f32Negate = 0x8c,
  f32Ceil = 0x8d,
  f32Floor = 0x8e,
  f32Truncate = 0x8f,
  f32Nearest = 0x90,
  f32SquareRoot = 0x91,
  f32Add = 0x92,
  f32Subtract = 0x93,
  f32Multiply = 0x94,
  f32Divide = 0x95,
  f32Minimum = 0x96,
  f32Maximum = 0x97,
  f32CopySign = 0x98,

  f64Absolute = 0x99,
  f64Negate = 0x9a,
  f64Ceil = 0x9b,
  f64Floor = 0x9c,
  f64Truncate = 0x9d,
  f64Nearest = 0x9e,
  f64SquareRoot = 0x9f,
  f64Add = 0xa0,
  f64Subtract = 0xa1,
  f64Multiply = 0xa2,
  f64Divide = 0xa3,
  f64Minimum = 0xa4,
  f64Maximum = 0xa5,
  f64CopySign = 0xa6,

  i32WrapI64 = 0xa7,
  i32TruncateF32Signed = 0xa8,
  i32TruncateF32Unsigned = 0xa9,
  i32TruncateF64Signed = 0xaa,
  i32TruncateF64Unsigned = 0xab,
  i64ExtendI32Signed = 0xac,
  i64ExtendI32Unsigned = 0xad,
  i64TruncateF32Signed = 0xae,
  i64TruncateF32Unsigned = 0xaf,
  i64TruncateF64Signed = 0xb0,
  i64TruncateF64Unsgined = 0xb1,
  f32ConvertI32Signed = 0xb2,
  f32ConvertI32Unsinged = 0xb3,
  f32ConvertI64Signed = 0xb4,
  f32Convert64Unsinged = 0xb5,
  f32DemoteF64 = 0xb6,
  f64ConvertI32Signed = 0xb7,
  f64ConvertI32Unsinged = 0xb8,
  f64ConvertI64Signed = 0xb9,
  f64Convert64Unsinged = 0xba,
  f64PromoteF32 = 0xbb,
  i32ReinterpretF32 = 0xbc,
  i64ReinterpretF64 = 0xbd,
  f32ReinterpretI32 = 0xbe,
  f64ReinterpretI64 = 0xbf,
}
export enum ImportDescription {
  function = 0x00,
  table,
  memory,
  global,
}
export enum ExportDescription {
  function = 0x00,
  table,
  memory,
  global,
}
