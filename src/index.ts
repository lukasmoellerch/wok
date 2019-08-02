import { TypedArrayBytestreamConsumer } from "./WASM/Encoding/TypedArrayBytestreamConsumer";
import * as EncodingConstants from "./WASM/Encoding/Constants";
import {
  encodeUTF8String,
  encodeNumberAsUnsignedLEB128
} from "./WASM/Encoding/Utils";
declare const WebAssembly: any;
export default async function main() {
  const consumer = new TypedArrayBytestreamConsumer();
  encodeUTF8String("\0asm", consumer);
  consumer.write([0x01], 4);

  consumer.write(EncodingConstants.Section.type);
  encodeNumberAsUnsignedLEB128(7, consumer);
  encodeNumberAsUnsignedLEB128(1, consumer);
  consumer.write(EncodingConstants.functionByte);
  encodeNumberAsUnsignedLEB128(2, consumer);
  consumer.write(EncodingConstants.ValueType.i32);
  consumer.write(EncodingConstants.ValueType.i32);
  encodeNumberAsUnsignedLEB128(1, consumer);
  consumer.write(EncodingConstants.ValueType.i32);

  consumer.write(EncodingConstants.Section.function);
  encodeNumberAsUnsignedLEB128(2, consumer);
  consumer.write(0x01);
  consumer.write(0x00);

  consumer.write(EncodingConstants.Section.export);
  encodeNumberAsUnsignedLEB128(10, consumer);
  consumer.write(0x01);
  consumer.write(0x06);
  encodeUTF8String("addTwo", consumer);
  consumer.write(0x00);
  consumer.write(0x00);

  consumer.write(EncodingConstants.Section.code);
  encodeNumberAsUnsignedLEB128(9, consumer);
  consumer.write(0x01);
  consumer.write(0x07);
  consumer.write(0x00);
  consumer.write(EncodingConstants.Instruction.localGet);
  consumer.write(0x00);
  consumer.write(EncodingConstants.Instruction.localGet);
  consumer.write(0x01);
  consumer.write(EncodingConstants.Instruction.i32Add);
  consumer.write(EncodingConstants.Instruction.blockend);

  const buffer = consumer.cleanArray;

  const result = await WebAssembly.instantiate(buffer);
  const sum = result.instance.exports.addTwo(12, 24);
  console.log(sum);
}
