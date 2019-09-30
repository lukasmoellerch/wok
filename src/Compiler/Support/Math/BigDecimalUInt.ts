import { DynamicByteArray } from "../DynamicByteArray";
export class BigDecimalUInt {
  public static zero = new BigDecimalUInt("");
  public static tenToThePowerOf(n: number): BigDecimalUInt {
    let a = new BigDecimalUInt(0);
    a = a.multipliedByTenToThePowerOf(n);
    return a;
  }
  public buffer: DynamicByteArray;

  constructor(str: string | DynamicByteArray | number) {
    if (typeof str === "string") {
      this.buffer = new DynamicByteArray(str.split("").reverse().map((a) => parseInt(a, 10)).filter((a) => !isNaN(a)));
    } else if (str instanceof DynamicByteArray) {
      this.buffer = str;
    } else {
      this.buffer = new DynamicByteArray((str.toString(10)).split("").reverse().map((a) => parseInt(a, 10)));
    }
  }
  public compare(other: BigDecimalUInt): number {
    if (this.buffer.length !== other.buffer.length) {
      if (this.buffer.length > other.buffer.length) {
        return 1;
      } else {
        return -1;
      }
    }
    for (let a = this.buffer.length - 1; a >= 0; a--) {
      const b = this.buffer.get(a);
      const c = other.buffer.get(a);
      if (b > c) {
        return 1;
      } else if (c > b) {
        return -1;
      }
    }
    return 0;
  }
  public strip() {
    let a = this.buffer.length - 1;
    while (this.buffer.get(a) === 0) {
      this.buffer.length--;
      a--;
    }
  }
  public add(other: BigDecimalUInt): BigDecimalUInt {
    const result = new BigDecimalUInt("");
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
      result.buffer.set(i, sum);
    }
    return result;
  }
  public subtract(other: BigDecimalUInt): BigDecimalUInt {
    const result = this.copy();
    const length = Math.max(this.buffer.length, other.buffer.length);
    let carry = 0;
    for (let i = 0; i < length || carry !== 0; i++) {
      const a = result.buffer.get(i) || 0;
      const b = other.buffer.get(i) || 0;
      let sum = a - (b + carry);
      if (sum < 0) {
        sum += 10;
        carry = 1;
      } else {
        carry = 0;
      }
      result.buffer.set(i, sum);
    }
    result.strip();
    return result;
  }
  public multipliedWithSingleDigit(q: number): BigDecimalUInt {
    const result = this.copy();
    const length = result.buffer.length;
    let carry = 0;
    for (let i = 0; i < length || carry !== 0; i++) {
      const a = result.buffer.get(i) || 0;
      let sum = a * q + carry;
      carry = 0;
      while (sum >= 10) {
        sum -= 10;
        carry++;
      }
      result.buffer.set(i, sum);
    }
    return result;
  }
  public dividedBySingleDigit(divisor: number): BigDecimalUInt {
    let carry = 0;
    const result = BigDecimalUInt.zero;
    for (let i = this.buffer.length - 1; i >= 0; i--) {
      const temp = 10 * carry + this.buffer.get(i);
      result.buffer.set(i, temp / divisor);
      carry = Math.floor(temp - divisor * result.buffer.get(i));
    }
    result.strip();
    return result;
  }
  public multipliedByTen(): BigDecimalUInt {
    const a = this.copy();
    a.buffer.unshift(0);
    return a;
  }
  public multipliedByTenToThePowerOf(n: number) {
    const a = this.copy();
    for (let i = 0; i < n; i++) {
      a.buffer.unshift(0);
    }
    return a;
  }
  public times(other: BigDecimalUInt): BigDecimalUInt {
    const buffer = new BigDecimalUInt("0");
    for (let i = 0; i < other.buffer.length; i++) {
      const digit = other.buffer.get(i);
      let c = this.copy();
      c = c.multipliedWithSingleDigit(digit);
      c = c.multipliedByTenToThePowerOf(i);
      buffer.add(c);
    }
    return buffer;
  }
  public stripped(): BigDecimalUInt {
    const a = this.copy();
    a.strip();
    return a;
  }
  public copy(): BigDecimalUInt {
    const a = new BigDecimalUInt("0");
    a.buffer = new DynamicByteArray(this.buffer.array);
    return a;
  }
  public display(): string {
    if (this.buffer.length === 0) {
      return "0";
    }
    return this.buffer.array.reverse().join("");
  }
  public splitAt(n: number): [BigDecimalUInt, BigDecimalUInt] {
    const [a, b] = this.buffer.splitAt(n);
    return [new BigDecimalUInt(a), new BigDecimalUInt(b)];
  }
  public dividedBy(other: BigDecimalUInt, q: BigDecimalUInt = BigDecimalUInt.zero): [BigDecimalUInt, BigDecimalUInt] {
    if (this.compare(other) === -1) {
      return [q, this];
    }
    return this.subtract(other).dividedBy(other, q.add(new BigDecimalUInt(1)));
  }
}
