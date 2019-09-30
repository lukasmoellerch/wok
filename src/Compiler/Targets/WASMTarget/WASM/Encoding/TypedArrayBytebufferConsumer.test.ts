import { TypedArrayBytestreamConsumer } from "./TypedArrayBytestreamConsumer";

test("Sequentially writing single bytes to the buffer", () => {
  const consumer = new TypedArrayBytestreamConsumer();
  consumer.write(42);
  consumer.write(23);
  consumer.write(89);
  consumer.write(42);
  const result = consumer.cleanArray;
  expect(result).toEqual(new Uint8Array([42, 23, 89, 42]));
});
test("Sequentially writing arrays of bytes to the buffer", () => {
  const consumer = new TypedArrayBytestreamConsumer();
  consumer.write([23, 64]);
  consumer.write([36, 12]);
  const result = consumer.cleanArray;
  expect(result).toEqual(new Uint8Array([23, 64, 36, 12]));
});
test("Zero padding arrays of bytes containing less bytes than the total size", () => {
  const consumer = new TypedArrayBytestreamConsumer();
  consumer.write([23, 64], 4);
  const result = consumer.cleanArray;
  expect(result).toEqual(new Uint8Array([23, 64, 0, 0]));
});
test("Truncating arrays of bytes containing more bytes than the size", () => {
  const consumer = new TypedArrayBytestreamConsumer();
  consumer.write([23, 64, 12, 42, 9, 8, 7, 6], 4);
  const result = consumer.cleanArray;
  expect(result).toEqual(new Uint8Array([23, 64, 12, 42]));
});
test("Single bytes can be written to reservde positions", () => {
  const consumer = new TypedArrayBytestreamConsumer();
  consumer.write(12);
  consumer.write(53);
  const position = consumer.reserveBytes(1);
  consumer.write(35);
  consumer.writeAt(position, 52);
  const result = consumer.cleanArray;
  expect(result).toEqual(new Uint8Array([12, 53, 52, 35]));
});
test("Reserving bytes enables writing to the buffer at that position later", () => {
  const consumer = new TypedArrayBytestreamConsumer();
  consumer.write(12);
  consumer.write(53);
  const position = consumer.reserveBytes(2);
  consumer.write(35);
  consumer.writeAt(position, [52, 54]);
  const result = consumer.cleanArray;
  expect(result).toEqual(new Uint8Array([12, 53, 52, 54, 35]));
});
test("Setting size when writing an array with more elements than specified to a reserved position truncates the data", () => {
  const consumer = new TypedArrayBytestreamConsumer();
  consumer.write(12);
  consumer.write(53);
  const position = consumer.reserveBytes(2);
  consumer.write(35);
  consumer.writeAt(position, [52, 54, 234, 45], 2);
  const result = consumer.cleanArray;
  expect(result).toEqual(new Uint8Array([12, 53, 52, 54, 35]));
});
test("Setting size when writing an array with less elements than specified to a reserved position fills the remaining bytes with zeroes", () => {
  const consumer = new TypedArrayBytestreamConsumer();
  consumer.write(12);
  consumer.write(53);
  const position = consumer.reserveBytes(2);
  consumer.write(35);
  consumer.writeAt(position, [52], 2);
  const result = consumer.cleanArray;
  expect(result).toEqual(new Uint8Array([12, 53, 52, 0, 35]));
});
test("Buffer is resized when writing many values to it", () => {
  const consumer = new TypedArrayBytestreamConsumer(4, 2);
  const bytes = 10000;
  const typedArray = new Uint8Array(bytes);
  for (let i = 0; i < bytes; i++) {
    typedArray[i] = i % 255;
    consumer.write(i % 255);
  }
  const result = consumer.cleanArray;
  expect(result).toEqual(typedArray);
});
