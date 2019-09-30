export interface IBytestreamConsumer {

  cleanArray: Uint8Array;
  write(data: number): void;
  write(data: number[] | Uint8Array, size?: number): void;
  reserveBytes(amount: number): number;
  writeAt(position: number, data: number): void;
  writeAt(position: number, data: number[] | Uint8Array, size?: number): void;
  append(buffer: IBytestreamConsumer): void;
}
