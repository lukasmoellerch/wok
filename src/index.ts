import { readFile, writeFile } from "fs";
import { promisify } from "util";
import { ICompilationUnit } from "./IR/AST";
import { compileIR } from "./IR/IRCompiler";
import { parse } from "./IR/Parser";
import { encodeModule } from "./WASM/Encoding/Encoder";
import { TypedArrayBytestreamConsumer } from "./WASM/Encoding/TypedArrayBytestreamConsumer";

declare const WebAssembly: any;
export default async function main() {
  const content = await promisify(readFile)(process.argv[2]);
  const ir: ICompilationUnit = parse(content.toString());
  const wsamModule = compileIR(ir);
  const consumer = new TypedArrayBytestreamConsumer();
  encodeModule(wsamModule, consumer);
  const encoded = consumer.cleanArray;
  await promisify(writeFile)(process.argv[3], encoded);
  const module = new WebAssembly.Module(encoded);
  const instance = new WebAssembly.Instance(module, {
    env: {
      printInteger(i: number) {
        console.log(i);
      },
    },
  });
  // instance.exports.main(12);
}
