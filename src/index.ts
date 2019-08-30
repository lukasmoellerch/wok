import { readFile, writeFile } from "fs";
import { promisify } from "util";
import { ExpressionParser } from "./Frontend/Expression Parsing/ExpressionParser";
import { OperatorScope } from "./Frontend/Expression Parsing/OperatorScope";
import { OperatorScopeBuilder } from "./Frontend/Expression Parsing/OperatorScopeBuilder";
import { IRCompiler } from "./Frontend/IRCompilation/Compiler";
import { Lexer } from "./Frontend/Lexer/Lexer";
import { ErrorFormatter } from "./Frontend/Parser/ErrorFormatter";
import { Parser } from "./Frontend/Parser/Parser";
import { TypeResolver } from "./Frontend/Type Scope/TypeResolver";
import { GlobalTypeTreeNode } from "./Frontend/Type Scope/TypeScope";
import { TypeScopeBuilder } from "./Frontend/Type Scope/TypeScopeBuilder";
import { injectNativeTypes } from "./Frontend/Type/NativeTypeProvider";
import { ImplictConversionWrapper } from "./Frontend/TypeChecking/ImplictConversionWrapper";
import { TypeChecker } from "./Frontend/TypeChecking/TypeChecker";
import { VariableScope } from "./Frontend/VariableScope/VariableScope";
import { VariableScopeBuilder } from "./Frontend/VariableScope/VariableScopeBuilder";
import { compileIR } from "./IR/IRCompiler";
import { IRPrinter } from "./IR/IRPrinter";
import { SSATransformer } from "./IR/SSATransformer";
import { encodeModule } from "./WASM/Encoding/Encoder";
import { TypedArrayBytestreamConsumer } from "./WASM/Encoding/TypedArrayBytestreamConsumer";

/*import { readFile } from "fs";
import { promisify } from "util";
import { Lexer } from "./Frontend/Lexer/Lexer";
import { ErrorFormatter } from './Frontend/Parser/ErrorFormatter';
import { Parser } from "./Frontend/Parser/Parser";
import { BigUInt } from './Support/Math/BigUInt';
*/
export default async function main() {
  const path = process.argv[2];
  const content = await promisify(readFile)(path || "testFile");
  const lexer = new Lexer(path, content.toString());
  const parser = new Parser(lexer);
  const result = parser.parseSourceFile();
  const errorFormatter = new ErrorFormatter(lexer.sourceString, path, parser.errors);

  const globalOperatorScope = new OperatorScope();
  const globalTypeScope = new GlobalTypeTreeNode();
  const globalVariableScope = new VariableScope();

  const typeScopeBuilder = new TypeScopeBuilder(result);
  const operatorScopeBuilder = new OperatorScopeBuilder(result, parser.errors);
  const variableScopeBuilder = new VariableScopeBuilder(globalTypeScope, result, parser.errors);
  const expressionParser = new ExpressionParser(result, parser.errors);
  const typeResolver = new TypeResolver(globalTypeScope, parser.errors);

  typeScopeBuilder.populateGlobalTypeScope(globalTypeScope);
  operatorScopeBuilder.populateGlobalOperatorScope(globalOperatorScope);
  variableScopeBuilder.populateGlobalVariableScope(globalVariableScope);
  injectNativeTypes(globalTypeScope);

  typeScopeBuilder.buildScopes();
  operatorScopeBuilder.buildScopes();
  expressionParser.parseExpressions();
  variableScopeBuilder.buildScopes();
  typeResolver.walkSourceFile(result);

  const typeChecker = new TypeChecker(globalTypeScope, parser.errors);
  typeChecker.walkSourceFile(result);
  const implictConversionWrapper = new ImplictConversionWrapper();
  implictConversionWrapper.walkSourceFile(result);
  if (parser.errors.length > 0) {
    process.stdout.write(errorFormatter.toString());
    return;
  }
  const irCompiler = new IRCompiler(globalTypeScope);
  irCompiler.compileSourceFile(result);
  const compilationUnit = irCompiler.compilationUnit;
  const ssaTransformer = new SSATransformer();
  const ssa = ssaTransformer.transformCompilationUnit(compilationUnit);
  const irPrinter = new IRPrinter();
  // const irString = irPrinter.stringifyCompilationUnit(ssa);
  const wasmModule = compileIR(ssa);
  const consumer = new TypedArrayBytestreamConsumer();
  encodeModule(wasmModule, consumer);
  const encoded = consumer.cleanArray;
  const asyncWriteFile = promisify(writeFile);
  await asyncWriteFile("./out.wasm", encoded);
  const module = new WebAssembly.Module(encoded);
  const decoder = new TextDecoder("utf-8");
  const instance = new WebAssembly.Instance(module, {
    env: {
      printInt(int: number) {
        console.log(int);
      },
      print(ptr: number, length: number) {
        const view = new DataView(memory, ptr, length);
        const str = decoder.decode(view);
        console.log(str);
      },
    },
  });
  console.log(instance.exports.memory);
  const memory = instance.exports.memory.buffer as ArrayBuffer;
  instance.exports.main(50);
}
