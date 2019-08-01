import { IBytestreamConsumer } from "./IBytestreamConsumer";
export class Encoder {
  constructor() {}
  encodeNumberAsSignedLEB128(n: number, consumer: IBytestreamConsumer): void {
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
  encodeNumberAsUnsignedLEB128(n: number, consumer: IBytestreamConsumer): void {
    const buffer = [];
    do {
      let byte = n & 0x7f;
      n >>>= 7;
      if (n !== 0) {
        byte |= 0x80;
      }
      buffer.push(byte);
    } while (n !== 0);
    for (let byte of buffer) {
      consumer.write(byte);
    }
  }
}
