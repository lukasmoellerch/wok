
interface IStream {
  read(data: ArrayBuffer, offset: number, n: number): void;
  write(data: ArrayBuffer, offset: number, length: number): void;
}
class ReadWriteStream implements IStream {
  private decoder = new TextDecoder("utf-8");
  private encoder = new TextEncoder();
  private readStream: NodeJS.ReadStream;
  private writeStream: NodeJS.WriteStream;
  constructor(readStream: NodeJS.ReadStream, writeStream: NodeJS.WriteStream) {
    this.readStream = readStream;
    this.writeStream = writeStream;
  }
  public write(data: ArrayBuffer, offset: number, length: number) {
    const view = new DataView(data, offset, length);
    const str = this.decoder.decode(view);
    this.writeStream.write(str);
  }
  public read(data: ArrayBuffer, offset: number, n: number) {
    const buffer = this.readStream.read(n).toString();
    const array = new Uint8Array(data, offset, n);
    this.encoder.encodeInto(buffer, array);
  }
}
export class Runtime {
  private streams: Map<number, IStream> = new Map();
  private stdStream = new ReadWriteStream(process.stdin, process.stdout);
  constructor() {
    this.streams.set(0, this.stdStream);
  }

}
