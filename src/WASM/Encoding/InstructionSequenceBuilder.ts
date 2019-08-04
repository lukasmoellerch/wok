import { IMemoryArgument, InstructionSequence } from "../AST";
import { Instruction, ResultType } from "./Constants";
import { IBytestreamConsumer } from "./IBytestreamConsumer";
import { TypedArrayBytestreamConsumer } from "./TypedArrayBytestreamConsumer";
import { encodeFloat32, encodeNumberAsSignedLEB128, encodeNumberAsUnsignedLEB128 } from "./Utils";
export class InstructionSequenceBuilder {
  get instructions(): InstructionSequence {
    return this.consumer.cleanArray;
  }
  public consumer: IBytestreamConsumer;
  constructor(consumer?: IBytestreamConsumer) {
    this.consumer = consumer || new TypedArrayBytestreamConsumer();
  }
  public unreachable(): void {
    this.consumer.write(Instruction.unreachable);
  }
  public nop(): void {
    this.consumer.write(Instruction.nop);
  }
  public block(type: ResultType, content: InstructionSequence): void {
    this.consumer.write(Instruction.blockstart);
    this.consumer.write(type);
    this.consumer.write([...content]);
    this.consumer.write(Instruction.blockend);
  }
  public loop(type: ResultType, content: InstructionSequence): void {
    this.consumer.write(Instruction.loopstart);
    this.consumer.write(type);
    this.consumer.write([...content]);
    this.consumer.write(Instruction.blockend);
  }
  public if(type: ResultType, content: InstructionSequence): void {
    this.consumer.write(Instruction.ifstart);
    this.consumer.write(type);
    this.consumer.write([...content]);
    this.consumer.write(Instruction.blockend);
  }
  public ifElse(
    type: ResultType,
    positive: InstructionSequence,
    negative: InstructionSequence,
  ): void {
    this.consumer.write(Instruction.blockstart);
    this.consumer.write(type);
    this.consumer.write([...positive]);
    this.consumer.write(Instruction.else);
    this.consumer.write([...negative]);
    this.consumer.write(Instruction.blockend);
  }
  public br(labelIndex: number): void {
    this.consumer.write(Instruction.br);
    encodeNumberAsUnsignedLEB128(labelIndex, this.consumer);
  }
  public brIf(labelIndex: number): void {
    this.consumer.write(Instruction.brIf);
    encodeNumberAsUnsignedLEB128(labelIndex, this.consumer);
  }
  public brTable(table: number[], labelIndex: number): void {
    const consumer = new TypedArrayBytestreamConsumer();
    for (const index of table) {
      encodeNumberAsUnsignedLEB128(index, consumer);
    }
    encodeNumberAsUnsignedLEB128(consumer.writtenBytes, this.consumer);
    this.consumer.append(consumer);
    this.consumer.write(Instruction.br);
    encodeNumberAsUnsignedLEB128(labelIndex, this.consumer);
  }
  public return(): void {
    this.consumer.write(Instruction.return);
  }
  public call(index: number): void {
    this.consumer.write(Instruction.call);
    encodeNumberAsUnsignedLEB128(index, this.consumer);
  }
  public callIndirect(typeIndex: number): void {
    this.consumer.write(Instruction.callIndirect);
    encodeNumberAsUnsignedLEB128(typeIndex, this.consumer);
    this.consumer.write(0x00);
  }
  public drop(): void {
    this.consumer.write(Instruction.drop);
  }
  public select(): void {
    this.consumer.write(Instruction.select);
  }
  public localGet(index: number): void {
    this.consumer.write(Instruction.localGet);
    encodeNumberAsUnsignedLEB128(index, this.consumer);
  }
  public localSet(index: number): void {
    this.consumer.write(Instruction.localSet);
    encodeNumberAsUnsignedLEB128(index, this.consumer);
  }
  public localTee(index: number): void {
    this.consumer.write(Instruction.localTee);
    encodeNumberAsUnsignedLEB128(index, this.consumer);
  }
  public globalGet(index: number): void {
    this.consumer.write(Instruction.globalGet);
    encodeNumberAsUnsignedLEB128(index, this.consumer);
  }
  public globalSet(index: number): void {
    this.consumer.write(Instruction.globalSet);
    encodeNumberAsUnsignedLEB128(index, this.consumer);
  }
  public load(loadInstruction: Instruction, memoryArgument: IMemoryArgument): void {
    this.consumer.write(loadInstruction);
    encodeNumberAsUnsignedLEB128(memoryArgument.align, this.consumer);
    encodeNumberAsUnsignedLEB128(memoryArgument.offset, this.consumer);
  }
  public store(loadInstruction: Instruction, memoryArgument: IMemoryArgument): void {
    this.consumer.write(loadInstruction);
    encodeNumberAsUnsignedLEB128(memoryArgument.align, this.consumer);
    encodeNumberAsUnsignedLEB128(memoryArgument.offset, this.consumer);
  }
  public i32Const(value: number): void {
    this.consumer.write(Instruction.i32Const);
    encodeNumberAsSignedLEB128(value, this.consumer);
  }
  public i64Const(value: number): void {
    this.consumer.write(Instruction.i64Const);
    encodeNumberAsSignedLEB128(value, this.consumer);
  }
  public f32Const(value: number): void {
    this.consumer.write(Instruction.f32Const);
    encodeFloat32(value, this.consumer);
  }
  // TODO
  public f64Const(value: number): void {
    this.consumer.write(Instruction.f64Const);
    encodeFloat32(value, this.consumer);
  }
  public numeric(instruction: Instruction): void {
    this.consumer.write(instruction);
  }
}
