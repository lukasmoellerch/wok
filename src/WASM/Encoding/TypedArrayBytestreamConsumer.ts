import { IBytestreamConsumer } from "./IBytestreamConsumer";

export class TypedArrayBytestreamConsumer implements IBytestreamConsumer {
  private array: Uint8Array;
  private index: number; // position not written to yet
  public get writtenBytes(): number {
    return this.index;
  }

  private growFactor: number;
  constructor(initialSize: number = 1024, growFactor: number = 2) {
    this.array = new Uint8Array(initialSize);
    this.growFactor = growFactor;
    this.index = 0;
  }
  public write(data: number): void;
  public write(data: number[], size?: number): void;
  public write(data: number | number[], size?: number) {
    if (typeof data === "number") {
      // Writes only the smallest byte to the buffer
      this.setIndexValueAndAdvance(data);
    } else {
      const numBytes = size || data.length;
      for (let i = 0; i < numBytes; i++) {
        if (data.length <= i) {
          this.setIndexValueAndAdvance(0); // Fill up the remaining bytes with zeroes
          continue;
        }
        this.setIndexValueAndAdvance(data[i]);
      }
    }
  }
  public reserveBytes(amount: number): number {
    const position = this.index;
    this.index += amount;
    return position;
  }
  public writeAt(position: number, data: number): void;
  public writeAt(position: number, data: number[], size?: number): void;
  public writeAt(position: number, data: number | number[], size?: number) {
    if (typeof data === "number") {
      // Writes only the smallest byte to the buffer
      this.set(position, data);
    } else {
      const numBytes = size || data.length;
      for (let i = 0; i < numBytes; i++) {
        if (data.length <= i) {
          this.set(position + i, 0); // Fill up the remaining bytes with zeroes
          continue;
        }
        this.set(position + i, data[i]);
      }
    }
  }
  public setIndexValueAndAdvance(data: number): void {
    this.setIndexValue(data);
    this.index++;
  }
  public setIndexValue(data: number): void {
    this.set(this.index, data);
  }
  public set(position: number, data: number): void {
    this.ensureSize(position + 1);
    this.array[position] = data & 0xff;
  }
  public ensureSize(minimumSize: number): void {
    let newSize = this.array.byteLength;
    if (minimumSize <= newSize) {
      return;
    }
    while (newSize < minimumSize) {
      newSize *= this.growFactor;
    }
    const newArray = new Uint8Array(newSize);
    newArray.set(this.array);
    this.array = newArray;
  }
  public get cleanArray(): Uint8Array {
    const clean = new Uint8Array(this.writtenBytes);
    clean.set(this.array.subarray(0, clean.length));
    return clean;
  }
  public append(buffer: IBytestreamConsumer): void {
    const otherClean = buffer.cleanArray;
    this.ensureSize(this.index + otherClean.length);
    this.array.set(otherClean, this.index);
    this.index += otherClean.length;
  }
}
