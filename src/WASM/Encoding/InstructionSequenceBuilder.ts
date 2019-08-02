import { InstructionSequence, IMemoryArgument } from "../AST";
import { IBytestreamConsumer } from "./IBytestreamConsumer";
import { TypedArrayBytestreamConsumer } from "./TypedArrayBytestreamConsumer";
import { ResultType, Instruction } from "./Constants";
import {
  encodeNumberAsUnsignedLEB128,
  encodeNumberAsSignedLEB128,
  encodeFloat32
} from "./Utils";
export class InstructionSequenceBuilder {
  constructor(consumer?: IBytestreamConsumer) {
    this.consumer = consumer || new TypedArrayBytestreamConsumer();
  }
  consumer: IBytestreamConsumer;
  get instructions(): InstructionSequence {
    return this.consumer.cleanArray;
  }
  unreachable(): void {
    this.consumer.write(Instruction.unreachable);
  }
  nop(): void {
    this.consumer.write(Instruction.nop);
  }
  block(type: ResultType, content: InstructionSequence): void {
    this.consumer.write(Instruction.blockstart);
    this.consumer.write(type);
    this.consumer.write([...content]);
    this.consumer.write(Instruction.blockend);
  }
  loop(type: ResultType, content: InstructionSequence): void {
    this.consumer.write(Instruction.loopstart);
    this.consumer.write(type);
    this.consumer.write([...content]);
    this.consumer.write(Instruction.blockend);
  }
  if(type: ResultType, content: InstructionSequence): void {
    this.consumer.write(Instruction.ifstart);
    this.consumer.write(type);
    this.consumer.write([...content]);
    this.consumer.write(Instruction.blockend);
  }
  ifElse(
    type: ResultType,
    positive: InstructionSequence,
    negative: InstructionSequence
  ): void {
    this.consumer.write(Instruction.blockstart);
    this.consumer.write(type);
    this.consumer.write([...positive]);
    this.consumer.write(Instruction.else);
    this.consumer.write([...negative]);
    this.consumer.write(Instruction.blockend);
  }
  br(labelIndex: number): void {
    this.consumer.write(Instruction.br);
    encodeNumberAsUnsignedLEB128(labelIndex, this.consumer);
  }
  brIf(labelIndex: number): void {
    this.consumer.write(Instruction.brIf);
    encodeNumberAsUnsignedLEB128(labelIndex, this.consumer);
  }
  brTable(table: number[], labelIndex: number): void {
    const consumer = new TypedArrayBytestreamConsumer();
    for (let index of table) {
      encodeNumberAsUnsignedLEB128(index, consumer);
    }
    encodeNumberAsUnsignedLEB128(consumer.writtenBytes, this.consumer);
    this.consumer.append(consumer);
    this.consumer.write(Instruction.br);
    encodeNumberAsUnsignedLEB128(labelIndex, this.consumer);
  }
  return(): void {
    this.consumer.write(Instruction.return);
  }
  call(index: number): void {
    this.consumer.write(Instruction.call);
    encodeNumberAsUnsignedLEB128(index, this.consumer);
  }
  callIndirect(typeIndex: number): void {
    this.consumer.write(Instruction.callIndirect);
    encodeNumberAsUnsignedLEB128(typeIndex, this.consumer);
    this.consumer.write(0x00);
  }
  drop(): void {
    this.consumer.write(Instruction.drop);
  }
  select(): void {
    this.consumer.write(Instruction.select);
  }
  localGet(index: number): void {
    this.consumer.write(Instruction.localGet);
    encodeNumberAsUnsignedLEB128(index, this.consumer);
  }
  localSet(index: number): void {
    this.consumer.write(Instruction.localSet);
    encodeNumberAsUnsignedLEB128(index, this.consumer);
  }
  localTee(index: number): void {
    this.consumer.write(Instruction.localTee);
    encodeNumberAsUnsignedLEB128(index, this.consumer);
  }
  globalGet(index: number): void {
    this.consumer.write(Instruction.globalGet);
    encodeNumberAsUnsignedLEB128(index, this.consumer);
  }
  globalSet(index: number): void {
    this.consumer.write(Instruction.globalSet);
    encodeNumberAsUnsignedLEB128(index, this.consumer);
  }
  load(loadInstruction: Instruction, memoryArgument: IMemoryArgument): void {
    this.consumer.write(loadInstruction);
    encodeNumberAsUnsignedLEB128(memoryArgument.align, this.consumer);
    encodeNumberAsUnsignedLEB128(memoryArgument.offset, this.consumer);
  }
  store(loadInstruction: Instruction, memoryArgument: IMemoryArgument): void {
    this.consumer.write(loadInstruction);
    encodeNumberAsUnsignedLEB128(memoryArgument.align, this.consumer);
    encodeNumberAsUnsignedLEB128(memoryArgument.offset, this.consumer);
  }
  i32Const(value: number): void {
    this.consumer.write(Instruction.i32Const);
    encodeNumberAsSignedLEB128(value, this.consumer);
  }
  i64Const(value: number): void {
    this.consumer.write(Instruction.i64Const);
    encodeNumberAsSignedLEB128(value, this.consumer);
  }
  f32Const(value: number): void {
    this.consumer.write(Instruction.f32Const);
    encodeFloat32(value, this.consumer);
  }
  // TODO
  f64Const(value: number): void {
    this.consumer.write(Instruction.f64Const);
    encodeFloat32(value, this.consumer);
  }
  numeric(instruction: Instruction): void {
    this.consumer.write(instruction);
  }
}
