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
  public debugInstructions: string[] = [];
  constructor(consumer?: IBytestreamConsumer) {
    this.consumer = consumer || new TypedArrayBytestreamConsumer();
  }
  public unreachable(): void {
    this.consumer.write(Instruction.unreachable);
    this.debugInstructions.push("unreachable");
  }
  public nop(): void {
    this.consumer.write(Instruction.nop);
    this.debugInstructions.push("nop");
  }
  public block(type: ResultType, content: InstructionSequenceBuilder): void {
    this.consumer.write(Instruction.blockstart);
    this.debugInstructions.push("blockstart");
    this.consumer.write(type);
    this.consumer.write([...content.instructions]);
    this.debugInstructions = this.debugInstructions.concat(content.debugInstructions);
    this.consumer.write(Instruction.blockend);
    this.debugInstructions.push("blockend");
  }
  public loop(type: ResultType, content: InstructionSequenceBuilder): void {
    this.consumer.write(Instruction.loopstart);
    this.debugInstructions.push("loopstart");
    this.consumer.write(type);
    this.consumer.write([...content.instructions]);
    this.debugInstructions = this.debugInstructions.concat(content.debugInstructions);
    this.consumer.write(Instruction.blockend);
  }
  public if(type: ResultType, content: InstructionSequenceBuilder): void {
    this.consumer.write(Instruction.ifstart);
    this.debugInstructions.push("ifstart");
    this.consumer.write(type);
    this.consumer.write([...content.instructions]);
    this.debugInstructions = this.debugInstructions.concat(content.debugInstructions);
    this.consumer.write(Instruction.blockend);
    this.debugInstructions.push("blockend");
  }
  public ifElse(
    type: ResultType,
    positive: InstructionSequenceBuilder,
    negative: InstructionSequenceBuilder,
  ): void {
    this.consumer.write(Instruction.ifstart);
    this.debugInstructions.push("ifstart");
    this.consumer.write(type);
    this.consumer.write([...positive.instructions]);
    this.debugInstructions = this.debugInstructions.concat(positive.debugInstructions);
    this.consumer.write(Instruction.else);
    this.debugInstructions.push("else");
    this.consumer.write([...negative.instructions]);
    this.debugInstructions = this.debugInstructions.concat(negative.debugInstructions);
    this.consumer.write(Instruction.blockend);
    this.debugInstructions.push("blockend");
  }
  public br(labelIndex: number): void {
    this.consumer.write(Instruction.br);
    this.debugInstructions.push("br " + labelIndex);
    encodeNumberAsUnsignedLEB128(labelIndex, this.consumer);
  }
  public brIf(labelIndex: number): void {
    this.consumer.write(Instruction.brIf);
    this.debugInstructions.push("brIf " + labelIndex);
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
    this.debugInstructions.push("return");
  }
  public call(index: number): void {
    this.consumer.write(Instruction.call);
    this.debugInstructions.push("call " + index);
    encodeNumberAsUnsignedLEB128(index, this.consumer);
  }
  public callIndirect(typeIndex: number): void {
    this.consumer.write(Instruction.callIndirect);
    this.debugInstructions.push("callIndirect " + typeIndex);
    encodeNumberAsUnsignedLEB128(typeIndex, this.consumer);
    this.consumer.write(0x00);
  }
  public drop(): void {
    this.consumer.write(Instruction.drop);
    this.debugInstructions.push("drop");
  }
  public select(): void {
    this.consumer.write(Instruction.select);
    this.debugInstructions.push("select");
  }
  public localGet(index: number): void {
    this.consumer.write(Instruction.localGet);
    this.debugInstructions.push("getLocal " + index);
    encodeNumberAsUnsignedLEB128(index, this.consumer);
  }
  public localSet(index: number): void {
    this.consumer.write(Instruction.localSet);
    this.debugInstructions.push("setLocal " + index);
    encodeNumberAsUnsignedLEB128(index, this.consumer);
  }
  public localTee(index: number): void {
    this.consumer.write(Instruction.localTee);
    this.debugInstructions.push("teeLocal " + index);
    encodeNumberAsUnsignedLEB128(index, this.consumer);
  }
  public globalGet(index: number): void {
    this.consumer.write(Instruction.globalGet);
    this.debugInstructions.push("getGlobal " + index);
    encodeNumberAsUnsignedLEB128(index, this.consumer);
  }
  public globalSet(index: number): void {
    this.consumer.write(Instruction.globalSet);
    this.debugInstructions.push("setGlobal " + index);
    encodeNumberAsUnsignedLEB128(index, this.consumer);
  }
  public load(loadInstruction: Instruction, memoryArgument: IMemoryArgument): void {
    this.consumer.write(loadInstruction);
    this.debugInstructions.push("load " + memoryArgument.align + " " + memoryArgument.offset);
    encodeNumberAsUnsignedLEB128(memoryArgument.align, this.consumer);
    encodeNumberAsUnsignedLEB128(memoryArgument.offset, this.consumer);
  }
  public store(storeInstruction: Instruction, memoryArgument: IMemoryArgument): void {
    this.consumer.write(storeInstruction);
    this.debugInstructions.push("store " + memoryArgument.align + " " + memoryArgument.offset);
    encodeNumberAsUnsignedLEB128(memoryArgument.align, this.consumer);
    encodeNumberAsUnsignedLEB128(memoryArgument.offset, this.consumer);
  }
  public i32Const(value: number): void {
    this.consumer.write(Instruction.i32Const);
    this.debugInstructions.push("i32Const " + value);
    encodeNumberAsSignedLEB128(value, this.consumer);
  }
  public i64Const(value: number): void {
    this.consumer.write(Instruction.i64Const);
    this.debugInstructions.push("i64Const " + value);
    encodeNumberAsSignedLEB128(value, this.consumer);
  }
  public f32Const(value: number): void {
    this.consumer.write(Instruction.f32Const);
    this.debugInstructions.push("f32Const " + value);
    encodeFloat32(value, this.consumer);
  }
  // TODO
  public f64Const(value: number): void {
    this.consumer.write(Instruction.f64Const);
    this.debugInstructions.push("f64Const " + value);
    encodeFloat32(value, this.consumer);
  }
  public numeric(instruction: Instruction): void {
    this.consumer.write(instruction);
    this.debugInstructions.push(Instruction[instruction]);
  }
  public end(): void {
    this.consumer.write(Instruction.blockend);
    this.debugInstructions.push("end");
  }
}
