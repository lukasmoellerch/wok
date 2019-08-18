import { DynamicByteArray } from "../DynamicByteArray";
export class BigDecimalUInt {
  public buffer: DynamicByteArray;
  constructor(str: string) {
    this.buffer = new DynamicByteArray(str.split("").reverse().map((a) => parseInt(a, 10)).filter((a) => !isNaN(a)));
  }
  public add(other: BigDecimalUInt) {
    const length = Math.max(this.buffer.length, other.buffer.length);
    let carry = 0;
    for (let i = 0; i < length || carry !== 0; i++) {
      const a = this.buffer.get(i) || 0;
      const b = other.buffer.get(i) || 0;
      let sum = a + b + carry;
      if (sum >= 10) {
        sum -= 10;
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
      while (sum >= 10) {
        sum -= 10;
        carry++;
      }
      this.buffer.set(i, sum);
    }
  }
  public multiplyByTen() {
    this.buffer.unshift(0);
  }
  public multiplyByTenToThePowerOf(n: number) {
    for (let i = 0; i < n; i++) {
      this.multiplyByTen();
    }
  }
  public multiplyBy(other: BigDecimalUInt) {
    const b = this.copy();
    this.buffer = new DynamicByteArray([0]);
    for (let i = 0; i < other.buffer.length; i++) {
      const digit = other.buffer.get(i);
      const c = b.copy();
      c.multiplyWithSingleDigit(digit);
      c.multiplyByTenToThePowerOf(i);
      this.add(c);
    }
  }
  public times(other: BigDecimalUInt): BigDecimalUInt {
    const buffer = new BigDecimalUInt("0");
    for (let i = 0; i < other.buffer.length; i++) {
      const digit = other.buffer.get(i);
      const c = this.copy();
      c.multiplyWithSingleDigit(digit);
      c.multiplyByTenToThePowerOf(i);
      buffer.add(c);
    }
    return buffer;
  }
  public copy(): BigDecimalUInt {
    const a = new BigDecimalUInt("0");
    a.buffer = new DynamicByteArray(this.buffer.array);
    return a;
  }
  public display(): string {
    return this.buffer.array.reverse().join("");
  }
}
