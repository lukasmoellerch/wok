import { readFile } from "fs";
import { promisify } from "util";
import { Lexer } from "./Frontend/Lexer/Lexer";
import { ErrorFormatter } from './Frontend/Parser/ErrorFormatter';
import { Parser } from "./Frontend/Parser/Parser";

declare const WebAssembly: any;
export default async function main() {
  const path = process.argv[2];
  const content = await promisify(readFile)(path);
  const lexer = new Lexer(path, content.toString());
  const parser = new Parser(lexer);
  const result = parser.parseSourceFile();
  console.log(result.toString("", true, true));
  const errorFormatter = new ErrorFormatter(lexer.sourceString, path, parser.errors);
  console.log(errorFormatter.toString());
  // instance.exports.main(12);
}
