import { readFile, writeFile } from "fs";
import { promisify } from "util";
import { DependencyAnalyzer } from "./Compiler/Frontend/DependencyAnalysis/DependencyAnalyzer";
import { ErrorFormatter } from "./Compiler/Frontend/ErrorHandling/ErrorFormatter";
import { ExpressionParser } from "./Compiler/Frontend/Expression Parsing/ExpressionParser";
import { OperatorScope } from "./Compiler/Frontend/Expression Parsing/OperatorScope";
import { OperatorScopeBuilder } from "./Compiler/Frontend/Expression Parsing/OperatorScopeBuilder";
import { IRCompiler } from "./Compiler/Frontend/IRCompilation/Compiler";
import { Lexer } from "./Compiler/Frontend/Lexer/Lexer";
import { Parser } from "./Compiler/Frontend/Parser/Parser";
import { TypeResolver } from "./Compiler/Frontend/Type Scope/TypeResolver";
import { GlobalTypeTreeNode } from "./Compiler/Frontend/Type Scope/TypeScope";
import { TypeScopeBuilder } from "./Compiler/Frontend/Type Scope/TypeScopeBuilder";
import { injectNativeTypes } from "./Compiler/Frontend/Type/NativeTypeProvider";
import { ImplictConversionWrapper } from "./Compiler/Frontend/TypeChecking/ImplictConversionWrapper";
import { TypeChecker } from "./Compiler/Frontend/TypeChecking/TypeChecker";
import { VariableScope } from "./Compiler/Frontend/VariableScope/VariableScope";
import { VariableScopeBuilder } from "./Compiler/Frontend/VariableScope/VariableScopeBuilder";
import { IRPrinter } from "./Compiler/IR/IRPrinter";
import { SSATransformer } from "./Compiler/IR/SSATransformer";
import { compileIR } from "./Compiler/Targets/WASMTarget/IRCompiler";
import { encodeModule } from "./Compiler/Targets/WASMTarget/WASM/Encoding/Encoder";
import { TypedArrayBytestreamConsumer } from "./Compiler/Targets/WASMTarget/WASM/Encoding/TypedArrayBytestreamConsumer";

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
  const typeResolver = new TypeResolver(globalTypeScope, parser.errors);
  const expressionParser = new ExpressionParser(result, parser.errors, typeResolver);

  typeScopeBuilder.populateGlobalTypeScope(globalTypeScope);
  operatorScopeBuilder.populateGlobalOperatorScope(globalOperatorScope);
  variableScopeBuilder.populateGlobalVariableScope(globalVariableScope);
  injectNativeTypes(globalTypeScope);

  typeScopeBuilder.buildScopes();
  operatorScopeBuilder.buildScopes();
  typeResolver.walkSourceFile(result);
  expressionParser.parseExpressions();
  variableScopeBuilder.buildScopes();

  const typeChecker = new TypeChecker(globalTypeScope, parser.errors);
  typeChecker.walkSourceFile(result);
  const implictConversionWrapper = new ImplictConversionWrapper();
  implictConversionWrapper.walkSourceFile(result);
  const dependencyAnalyzer = new DependencyAnalyzer(parser.errors);
  dependencyAnalyzer.walkSourceFile(result);
  if (process.argv.includes("--print-ast")) {
    process.stdout.write(result.toString());
  }
  if (parser.errors.length > 0) {
    process.stdout.write(errorFormatter.toString());
    return;
  }
  if (process.argv.includes("--print-tasks")) {
    for (const task of dependencyAnalyzer.compilerTasks) {
      process.stdout.write(task.toString() + "\n");
    }
  }
  const irCompiler = new IRCompiler(globalTypeScope, dependencyAnalyzer.compilerTasks);
  irCompiler.compile();
  const compilationUnit = irCompiler.compilationUnit;

  if (process.argv.includes("--print-ir")) {
    const irPrinter = new IRPrinter();
    const irString = irPrinter.stringifyCompilationUnit(compilationUnit);
    process.stdout.write(irString);
  }

  const ssaTransformer = new SSATransformer();
  const ssa = ssaTransformer.transformCompilationUnit(compilationUnit);
  // removeCopyStatements(ssa);

  if (process.argv.includes("--print-ssa")) {
    const irPrinter = new IRPrinter();
    const irString = irPrinter.stringifyCompilationUnit(ssa);
    process.stdout.write(irString);
  }

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
        process.stdout.write(int.toString() + "\n");
      },
      print(ptr: number, length: number) {
        const view = new DataView(memory, ptr, length);
        const str = decoder.decode(view);
        process.stdout.write(str);
      },
    },
  });
  const memory = instance.exports.memory.buffer as ArrayBuffer;
  instance.exports._start();
}
