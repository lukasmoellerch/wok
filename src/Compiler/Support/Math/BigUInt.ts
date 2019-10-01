import { DynamicByteArray } from "../DynamicByteArray";
export class BigUInt {
  public buffer: DynamicByteArray;
  constructor(str: string) {
    const buffer: number[] = [];
    for (let i = str.length - 1; i >= 0; i -= 2) {
      const a = parseInt((i - 1) >= 0 ? str[i - 1] : "0", 16);
      const b = parseInt(str[i], 16);
      const s = a * 0x10 + b;
      buffer.push(s);
    }
    this.buffer = new DynamicByteArray(buffer);
  }
  public add(other: BigUInt) {
    const length = Math.max(this.buffer.length, other.buffer.length);
    let carry = 0;
    for (let i = 0; i < length || carry !== 0; i++) {
      const a = this.buffer.get(i) || 0;
      const b = other.buffer.get(i) || 0;
      let sum = a + b + carry;
      if (sum >= 256) {
        sum -= 256;
        carry = 1;
      } else {
        carry = 0;
      }
      this.buffer.set(i, sum);
    }
  }
  public multiplyWithSingleDigit(q: number) {
    const length = this.buffer.length;
    let carry = 0;
    for (let i = 0; i < length || carry !== 0; i++) {
      const a = this.buffer.get(i) || 0;
      let sum = a * q + carry;
      carry = 0;
      while (sum >= 256) {
        sum -= 256;
        carry++;
      }
      this.buffer.set(i, sum);
    }
  }
  public multiplyByTwoHundredAndFiftySix() {
    this.buffer.unshift(0);
  }
  public multiplyByTwoHundredAndFiftySixToThePowerOf(n: number) {
    for (let i = 0; i < n; i++) {
      this.multiplyByTwoHundredAndFiftySix();
    }
  }
  public multiplyBy(other: BigUInt) {
    const b = this.copy();
    this.buffer = new DynamicByteArray([0]);
    for (let i = 0; i < other.buffer.length; i++) {
      const digit = other.buffer.get(i);
      const c = b.copy();
      c.multiplyWithSingleDigit(digit);
      c.multiplyByTwoHundredAndFiftySixToThePowerOf(i);
      this.add(c);
    }
  }
  public times(other: BigUInt): BigUInt {
    const buffer = new BigUInt("0");
    for (let i = 0; i < other.buffer.length; i++) {
      const digit = other.buffer.get(i);
      const c = this.copy();
      c.multiplyWithSingleDigit(digit);
      c.multiplyByTwoHundredAndFiftySixToThePowerOf(i);
      buffer.add(c);
    }
    return buffer;
  }
  public copy(): BigUInt {
    const a = new BigUInt("0");
    a.buffer = new DynamicByteArray(this.buffer.array);
    return a;
  }
  public display(): string {
    return this.buffer.array.reverse().map((a) => a == 0 ? "0" : a.toString(16)).join(" ");
  }
}
