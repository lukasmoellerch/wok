import { TextEncoder } from "util";
import { IBytestreamConsumer } from "./IBytestreamConsumer";
const textEncoder =
  typeof TextEncoder !== "undefined" ? new TextEncoder() : null;
export function encodeNumberAsSignedLEB128(
  n: number,
  consumer: IBytestreamConsumer,
): void {
  const buffer = [];

  let more = true;
  while (more) {
    let byte = n & 0x7f;
    n >>= 7;
    if (n === 0 && (byte & 0x40) === 0) {
      more = false;
    } else if (n === -1 && byte & 0x40) {
      more = false;
    } else {
      byte |= 0x80;
    }
    buffer.push(byte);
  }

  consumer.write(buffer);
}
export function encodeNumberAsUnsignedLEB128(
  n: number,
  consumer: IBytestreamConsumer,
): void {
  const buffer = [];
  do {
    let byte = n & 0x7f;
    n >>>= 7;
    if (n !== 0) {
      byte |= 0x80;
    }
    buffer.push(byte);
  } while (n !== 0);
  for (const byte of buffer) {
    consumer.write(byte);
  }
}
export function encodeFloat32(n: number, consumer: IBytestreamConsumer): void {
  const array = new Float32Array([n]);
  const bytes = new Uint8Array(array.buffer);
  consumer.write([...bytes], 4);
}
export function encodeFloat64(n: number, consumer: IBytestreamConsumer): void {
  const array = new Float64Array([n]);
  const bytes = new Uint8Array(array.buffer);
  consumer.write([...bytes], 8);
}
export function encodeUInt8(n: number, consumer: IBytestreamConsumer): void {
  consumer.write([n], 1);
}
export function encodeSInt8(n: number, consumer: IBytestreamConsumer): void {
  const array = new Int8Array([n]);
  const bytes = new Uint8Array(array.buffer);
  consumer.write([...bytes], 1);
}
export function encodeUTF8String(
  str: string,
  consumer: IBytestreamConsumer,
): void {
  if (textEncoder) {
    const array = textEncoder.encode(str);
    consumer.write([...array]);
  } else {
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      consumer.write(charCode);
    }
  }
}
export function encodeName(
  str: string,
  consumer: IBytestreamConsumer,
): void {
  if (textEncoder) {
    const array = textEncoder.encode(str);
    encodeNumberAsUnsignedLEB128(array.length, consumer);
    consumer.write([...array]);
  } else {
    encodeNumberAsUnsignedLEB128(str.length, consumer);
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      consumer.write(charCode);
    }
  }
}
