export class DynamicByteArray {
  public get reversed(): number[] {
    const array: number[] = [];
    for (let i = this.length - 1; i >= 0; i--) {
      array.push(this.get(i));
    }
    return array;
  }
  public get array(): number[] {
    const array: number[] = [];
    for (let i = 0; i < this.length; i++) {
      array.push(this.get(i));
    }
    return array;
  }
  private static nextPowerOfTwo(v: number) {
    v--;
    v |= v >> 1;
    v |= v >> 2;
    v |= v >> 4;
    v |= v >> 8;
    v |= v >> 16;
    v++;
    return v;
  }
  public buffer: Uint8Array;
  public length: number;
  constructor(buffer: Uint8Array, length: number)
  constructor(data: number[])
  constructor(a: number[] | Uint8Array, b?: number) {
    if (a instanceof Uint8Array && b !== undefined) {
      this.buffer = a;
      this.length = b;
    } else {
      const data = a;
      this.length = data.length;
      const arraySize = DynamicByteArray.nextPowerOfTwo(this.length);
      this.buffer = new Uint8Array(arraySize);
      for (let i = 0; i < data.length; i++) {
        this.buffer[i] = data[i];
      }
    }
  }
  public set(index: number, value: number) {
    if (index >= this.buffer.length) {
      const newBuffer = new Uint8Array(DynamicByteArray.nextPowerOfTwo(index + 1));
      newBuffer.set(this.buffer);
      this.buffer = newBuffer;
    }
    if ((index + 1) > this.length) {
      this.length = index + 1;
    }
    this.buffer[index] = value;
  }
  public get(index: number): number {
    return this.buffer[index];
  }
  public map<T>(fn: ((arg: number) => T)): T[] {
    const array: T[] = [];
    for (let i = 0; i < this.length; i++) {
      array.push(fn(this.get(i)));
    }
    return array;
  }
  public copy(): DynamicByteArray {
    return new DynamicByteArray(this.array);
  }
  public unshift(value: number) {
    for (let i = this.length; i > 0; i--) {
      this.set(i, this.get(i - 1));
    }
    this.set(0, value);
  }
  public splitAt(q: number): [DynamicByteArray, DynamicByteArray] {
    const at = this.length - q;
    const lowerHalfSize = DynamicByteArray.nextPowerOfTwo(at);
    const upperHalfSize = DynamicByteArray.nextPowerOfTwo(this.length - at);
    const lowerHalf = new Uint8Array(lowerHalfSize);
    const upperHalf = new Uint8Array(upperHalfSize);
    const l = new DynamicByteArray(lowerHalf, at);
    const h = new DynamicByteArray(upperHalf, this.length - at);
    for (let i = 0; i < at; i++) {
      lowerHalf[i] = this.buffer[i];
    }
    let j = 0;
    for (let i = at; i < this.length; i++) {
      upperHalf[j] = this.buffer[i];
      j++;
    }
    return [h, l];
  }
}
