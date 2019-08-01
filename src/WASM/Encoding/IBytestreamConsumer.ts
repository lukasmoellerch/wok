export interface IBytestreamConsumer<T> {
  write(data: number): void;
  write(data: number[]): void;
  write(data: number[], size: number): void;
  reserveBytes(amount: number): T;
  writeAt(position: T, data: number): void;
  writeAt(position: T, data: number[]): void;
  writeAt(position: T, data: number[], size: number): void;
}
