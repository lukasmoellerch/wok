export interface IBytestreamConsumer {
  write(data: number): void;
  write(data: number[]): void;
  write(data: number[], size: number): void;
  reserveBytes(amount: number): number;
  writeAt(position: number, data: number): void;
  writeAt(position: number, data: number[]): void;
  writeAt(position: number, data: number[], size: number): void;

  cleanArray: Uint8Array;
  append(buffer: IBytestreamConsumer): void;
}
