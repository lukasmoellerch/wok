namespace WASM.Encoding {
  export interface IBytestreamConsumer<T> {
    write(data: number): void;
    write(data: number[]): void;
    write(data: number[], size: number): void;
    reserveBytes(amount: number): T;
    write(position: T, data: number): void;
    write(position: T, data: number[]): void;
    write(position: T, data: number[], size: number): void;
  }
}
