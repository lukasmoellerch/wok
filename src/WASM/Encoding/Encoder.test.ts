import { TypedArrayBytestreamConsumer } from "./TypedArrayBytestreamConsumer";
import { Encoder } from "./Encoder";
test("should encode signed numbers using LEB128", () => {
  const cases: Array<[number, number[]]> = [
    [0, [0]],
    [1, [0x01]],
    [2, [0x02]],
    [127, [0xff, 0x00]],
    [128, [0x80, 0x01]],
    [129, [0x81, 0x01]],
    [-1, [0x7f]],
    [-2, [0x7e]],
    [-127, [0x81, 0x7f]],
    [-128, [0x80, 0x7f]],
    [-129, [0xff, 0x7e]]
  ];
  const encoder = new Encoder();
  for (let testCase of cases) {
    let [n, expected] = testCase;
    let consumer = new TypedArrayBytestreamConsumer();
    encoder.encodeNumberAsSignedLEB128(n, consumer);
    let result = consumer.cleanArray;
    let expectedArray = new Uint8Array(expected);
    expect(result).toEqual(expectedArray);
  }
});
test("should encode unsigned numbers using LEB128", () => {
  const cases: Array<[number, number[]]> = [
    [0, [0]],
    [1, [0x01]],
    [2, [0x02]],
    [127, [0x7f]],
    [128, [0x80, 0x01]],
    [129, [0x81, 0x01]],
    [130, [0x82, 0x01]],
    [12857, [0xb9, 0x64]],
    [16256, [0x80, 0x7f]],
    [0x40c, [0x8c, 0x08]],
    [624485, [0xe5, 0x8e, 0x26]]
  ];
  const encoder = new Encoder();
  for (let testCase of cases) {
    let [n, expected] = testCase;
    let consumer = new TypedArrayBytestreamConsumer();
    encoder.encodeNumberAsUnsignedLEB128(n, consumer);
    let result = consumer.cleanArray;
    let expectedArray = new Uint8Array(expected);
    expect(result).toEqual(expectedArray);
  }
});
