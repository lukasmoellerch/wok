const wasmCode = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 150, 128, 128, 128, 0, 4, 96, 0, 1, 127, 96, 2, 127, 127, 1, 126, 96, 1, 126, 0, 96, 4, 127, 127, 127, 127, 0, 3, 148, 128, 128, 128, 0, 19, 0, 0, 1, 1, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 132, 128, 128, 128, 0, 1, 112, 0, 0, 5, 131, 128, 128, 128, 0, 1, 0, 1, 6, 129, 128, 128, 128, 0, 0, 7, 254, 129, 128, 128, 0, 20, 6, 109, 101, 109, 111, 114, 121, 2, 0, 21, 103, 101, 116, 72, 105, 103, 104, 77, 101, 109, 111, 114, 121, 76, 111, 99, 97, 116, 105, 111, 110, 0, 0, 20, 103, 101, 116, 76, 111, 119, 77, 101, 109, 111, 114, 121, 76, 111, 99, 97, 116, 105, 111, 110, 0, 1, 23, 97, 115, 115, 101, 109, 98, 108, 101, 79, 112, 101, 114, 97, 110, 100, 85, 110, 115, 105, 103, 110, 101, 100, 0, 2, 21, 97, 115, 115, 101, 109, 98, 108, 101, 79, 112, 101, 114, 97, 110, 100, 83, 105, 103, 110, 101, 100, 0, 3, 12, 115, 97, 118, 101, 85, 110, 115, 105, 103, 110, 101, 100, 0, 4, 10, 115, 97, 118, 101, 83, 105, 103, 110, 101, 100, 0, 5, 3, 97, 100, 100, 0, 6, 3, 115, 117, 98, 0, 7, 3, 109, 117, 108, 0, 8, 11, 100, 105, 118, 85, 110, 115, 105, 103, 110, 101, 100, 0, 9, 11, 114, 101, 109, 85, 110, 115, 105, 103, 110, 101, 100, 0, 10, 9, 100, 105, 118, 83, 105, 103, 110, 101, 100, 0, 11, 9, 114, 101, 109, 83, 105, 103, 110, 101, 100, 0, 12, 3, 97, 110, 100, 0, 13, 2, 111, 114, 0, 14, 3, 120, 111, 114, 0, 15, 3, 115, 104, 108, 0, 16, 11, 115, 104, 114, 85, 110, 115, 105, 103, 110, 101, 100, 0, 17, 9, 115, 104, 114, 83, 105, 103, 110, 101, 100, 0, 18, 10, 180, 133, 128, 128, 0, 19, 132, 128, 128, 128, 0, 0, 65, 12, 11, 132, 128, 128, 128, 0, 0, 65, 16, 11, 140, 128, 128, 128, 0, 0, 32, 0, 173, 66, 32, 134, 32, 1, 173, 132, 11, 140, 128, 128, 128, 0, 0, 32, 0, 173, 66, 32, 134, 32, 1, 173, 132, 11, 147, 128, 128, 128, 0, 0, 65, 0, 32, 0, 62, 2, 16, 65, 0, 32, 0, 66, 32, 136, 62, 2, 12, 11, 147, 128, 128, 128, 0, 0, 65, 0, 32, 0, 62, 2, 16, 65, 0, 32, 0, 66, 32, 136, 62, 2, 12, 11, 170, 128, 128, 128, 0, 1, 1, 126, 65, 0, 32, 2, 173, 66, 32, 134, 32, 3, 173, 132, 32, 0, 173, 66, 32, 134, 32, 1, 173, 132, 124, 34, 4, 62, 2, 16, 65, 0, 32, 4, 66, 32, 136, 62, 2, 12, 11, 170, 128, 128, 128, 0, 1, 1, 126, 65, 0, 32, 0, 173, 66, 32, 134, 32, 1, 173, 132, 32, 2, 173, 66, 32, 134, 32, 3, 173, 132, 125, 34, 4, 62, 2, 16, 65, 0, 32, 4, 66, 32, 136, 62, 2, 12, 11, 170, 128, 128, 128, 0, 1, 1, 126, 65, 0, 32, 2, 173, 66, 32, 134, 32, 3, 173, 132, 32, 0, 173, 66, 32, 134, 32, 1, 173, 132, 126, 34, 4, 62, 2, 16, 65, 0, 32, 4, 66, 32, 136, 62, 2, 12, 11, 170, 128, 128, 128, 0, 1, 1, 126, 65, 0, 32, 0, 173, 66, 32, 134, 32, 1, 173, 132, 32, 2, 173, 66, 32, 134, 32, 3, 173, 132, 128, 34, 4, 62, 2, 16, 65, 0, 32, 4, 66, 32, 136, 62, 2, 12, 11, 170, 128, 128, 128, 0, 1, 1, 126, 65, 0, 32, 0, 173, 66, 32, 134, 32, 1, 173, 132, 32, 2, 173, 66, 32, 134, 32, 3, 173, 132, 130, 34, 4, 62, 2, 16, 65, 0, 32, 4, 66, 32, 136, 62, 2, 12, 11, 170, 128, 128, 128, 0, 1, 1, 126, 65, 0, 32, 0, 173, 66, 32, 134, 32, 1, 173, 132, 32, 2, 173, 66, 32, 134, 32, 3, 173, 132, 127, 34, 4, 62, 2, 16, 65, 0, 32, 4, 66, 32, 136, 62, 2, 12, 11, 170, 128, 128, 128, 0, 1, 1, 126, 65, 0, 32, 0, 173, 66, 32, 134, 32, 1, 173, 132, 32, 2, 173, 66, 32, 134, 32, 3, 173, 132, 129, 34, 4, 62, 2, 16, 65, 0, 32, 4, 66, 32, 136, 62, 2, 12, 11, 170, 128, 128, 128, 0, 1, 1, 126, 65, 0, 32, 2, 173, 66, 32, 134, 32, 3, 173, 132, 32, 0, 173, 66, 32, 134, 32, 1, 173, 132, 131, 34, 4, 62, 2, 16, 65, 0, 32, 4, 66, 32, 136, 62, 2, 12, 11, 150, 128, 128, 128, 0, 0, 65, 0, 32, 1, 32, 3, 114, 54, 2, 16, 65, 0, 32, 0, 32, 2, 114, 54, 2, 12, 11, 170, 128, 128, 128, 0, 1, 1, 126, 65, 0, 32, 2, 173, 66, 32, 134, 32, 3, 173, 132, 32, 0, 173, 66, 32, 134, 32, 1, 173, 132, 133, 34, 4, 62, 2, 16, 65, 0, 32, 4, 66, 32, 136, 62, 2, 12, 11, 170, 128, 128, 128, 0, 1, 1, 126, 65, 0, 32, 0, 173, 66, 32, 134, 32, 1, 173, 132, 32, 2, 173, 66, 32, 134, 32, 3, 173, 132, 134, 34, 4, 62, 2, 16, 65, 0, 32, 4, 66, 32, 136, 62, 2, 12, 11, 170, 128, 128, 128, 0, 1, 1, 126, 65, 0, 32, 0, 173, 66, 32, 134, 32, 1, 173, 132, 32, 2, 173, 66, 32, 134, 32, 3, 173, 132, 136, 34, 4, 62, 2, 16, 65, 0, 32, 4, 66, 32, 136, 62, 2, 12, 11, 170, 128, 128, 128, 0, 1, 1, 126, 65, 0, 32, 0, 173, 66, 32, 134, 32, 1, 173, 132, 32, 2, 173, 66, 32, 134, 32, 3, 173, 132, 135, 34, 4, 62, 2, 16, 65, 0, 32, 4, 66, 32, 136, 62, 2, 12, 11, 11, 147, 128, 128, 128, 0, 2, 0, 65, 12, 11, 4, 0, 0, 0, 0, 0, 65, 16, 11, 4, 0, 0, 0, 0]);
export class UInt64 {
  public static instance = new WebAssembly.Instance(new WebAssembly.Module(wasmCode));
  public static exports = UInt64.instance.exports;
  public static highLocation: number = UInt64.exports.getHighMemoryLocation();
  public static lowLocation: number = UInt64.exports.getLowMemoryLocation();
  public static memory = UInt64.instance.exports.memory;
  public static dataView = new DataView(UInt64.memory.buffer);
  public static loadResult(): UInt64 {
    const hi = UInt64.dataView.getUint32(UInt64.highLocation, true);
    const lo = UInt64.dataView.getUint32(UInt64.lowLocation, true);
    return new UInt64(hi, lo);
  }

  public hi: number; // 32 bit integer
  public lo: number; // 32 bit integer
  constructor(hi: number, lo: number) {
    this.hi = hi;
    this.lo = lo;
  }
  /**
   * Writes value at index
   * @param index Index indexed from the low bits of the integer
   * @param value value that should be written at the index
   */
  public setBit(index: number, value: boolean) {
    if (value) {
      this.addBit(index);
    } else {
      this.removeBit(index);
    }
  }
  public addBit(index: number) {
    let mask: number;
    if (index < 32) {
      mask = 0x01 << index;
      this.lo |= mask;
    } else {
      mask = 0x01 << (index - 32);
    }
  }
  public removeBit(index: number) {
    let mask: number;
    if (index < 32) {
      mask = 0x01 << index;
      this.lo &= ~mask;
    } else {
      mask = 0x01 << (index - 32);
    }
  }

  public add(other: UInt64): UInt64 {
    UInt64.exports.add(this.hi, this.lo, other.hi, other.lo);
    return UInt64.loadResult();
  }
  public subtract(other: UInt64): UInt64 {
    UInt64.exports.sub(this.hi, this.lo, other.hi, other.lo);
    return UInt64.loadResult();
  }
  public times(other: UInt64): UInt64 {
    UInt64.exports.mul(this.hi, this.lo, other.hi, other.lo);
    return UInt64.loadResult();
  }
  public dividedBy(other: UInt64): UInt64 {
    UInt64.exports.divUnsigned(this.hi, this.lo, other.hi, other.lo);
    return UInt64.loadResult();
  }
  public remainder(other: UInt64): UInt64 {
    UInt64.exports.remUnsigned(this.hi, this.lo, other.hi, other.lo);
    return UInt64.loadResult();
  }
  public and(other: UInt64): UInt64 {
    UInt64.exports.and(this.hi, this.lo, other.hi, other.lo);
    return UInt64.loadResult();
  }
  public or(other: UInt64): UInt64 {
    UInt64.exports.or(this.hi, this.lo, other.hi, other.lo);
    return UInt64.loadResult();
  }
  public xor(other: UInt64): UInt64 {
    UInt64.exports.xor(this.hi, this.lo, other.hi, other.lo);
    return UInt64.loadResult();
  }
  public shr(other: UInt64): UInt64 {
    UInt64.exports.shrUnsigned(this.hi, this.lo, other.hi, other.lo);
    return UInt64.loadResult();
  }
}
