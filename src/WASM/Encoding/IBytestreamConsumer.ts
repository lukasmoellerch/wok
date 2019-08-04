export interface IBytestreamConsumer {

  cleanArray: Uint8Array;
  write(data: number): void;
  write(data: number[], size?: number): void;
  reserveBytes(amount: number): number;
  writeAt(position: number, data: number): void;
  writeAt(position: number, data: number[], size?: number): void;
  append(buffer: IBytestreamConsumer): void;
}
