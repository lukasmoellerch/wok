import { DynamicByteArray } from "../DynamicByteArray";
import { BigDecimalUInt } from "./BigDecimalUInt";
export class BigDecimalInt extends BigDecimalUInt {
  public static tenToThePowerOf(n: number): BigDecimalInt {
    const a = new BigDecimalUInt(0);
    a.multipliedByTenToThePowerOf(n);
    return new BigDecimalInt(1, a);
  }
  public sign: number;
  constructor(sign: number, str: string | DynamicByteArray | number | BigDecimalUInt) {
    if (str instanceof BigDecimalUInt) {
      super(str.buffer);
    } else {
      super(str);
    }
    this.sign = sign;
  }
  public addS(other: BigDecimalInt): BigDecimalInt {
    if (this.sign === other.sign) {
      const a = this.add(other);
      return new BigDecimalInt(this.sign, a);
    } else {
      const cmp = this.compare(other);
      if (cmp === 1) {
        return new BigDecimalInt(this.sign, this.subtract(other));
      } else if (cmp === -1) {
        return new BigDecimalInt(other.sign, other.subtract(this));
      } else {
        return new BigDecimalInt(0, 0);
      }
    }
  }
  public subtractS(other: BigDecimalInt): BigDecimalInt {
    if (this.sign !== other.sign) {
      return new BigDecimalInt(this.sign, this.add(other));
    } else {
      const cmp = this.compare(other);
      if (cmp === 1) {
        return new BigDecimalInt(this.sign, this.subtract(other));
      } else if (cmp === -1) {
        return new BigDecimalInt(other.sign * -1, other.subtract(this));
      } else {
        return new BigDecimalInt(0, 0);
      }
    }
  }
  public timesS(other: BigDecimalInt): BigDecimalInt {
    const sign = this.sign * other.sign;
    return new BigDecimalInt(sign, this.times(other));
  }
  public karatsuba(other: BigDecimalInt): BigDecimalInt {
    if ((this.buffer.length <= 1) || (other.buffer.length <= 1)) {
      return this.timesS(other);
    }
    const m = Math.min(this.buffer.length, other.buffer.length);
    const m2 = Math.floor(m / 2.0);

    const [high1, low1] = this.splitAt(m2);
    const [high2, low2] = other.splitAt(m2);

    console.log();
    console.log(this.buffer.array);
    console.log(m2);
    console.log(high1.buffer.array, low1.buffer.array);

    const z0 = low1.karatsuba(low2);
    const z1 = (low1.addS(high1)).karatsuba((low2.addS(high2)));
    const z2 = high1.karatsuba(high2);

    const a = z2.timesS(BigDecimalInt.tenToThePowerOf(m2 * 2));
    const b = ((z1.subtractS(z2).subtractS(z0)).timesS(BigDecimalInt.tenToThePowerOf(m2)));
    const c = z0;

    return a.addS(b).addS(c).stripped();
  }
  public splitAt(n: number): [BigDecimalInt, BigDecimalInt] {
    const [a, b] = this.buffer.splitAt(n);
    return [new BigDecimalInt(this.sign, new BigDecimalUInt(a)), new BigDecimalInt(this.sign, new BigDecimalUInt(b))];
  }
  public stripped(): BigDecimalInt {
    const a = this.copy();
    a.strip();
    return a;
  }
  public copy(): BigDecimalInt {
    const a = new BigDecimalInt(this.sign, "0");
    a.buffer = new DynamicByteArray(this.buffer.array);
    return a;
  }
  public display(): string {
    return this.sign !== -1 ? super.display() : "-" + (super.display());
  }
}
