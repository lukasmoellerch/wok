import chalk from "chalk";
import { readFile, writeFile } from "fs";
import * as path from "path";
import { promisify } from "util";
import { DependencyAnalyzer } from "./Compiler/Frontend/DependencyAnalysis/DependencyAnalyzer";
import { ErrorFormatter } from "./Compiler/Frontend/ErrorHandling/ErrorFormatter";
import { ExpressionParser } from "./Compiler/Frontend/Expression Parsing/ExpressionParser";
import { OperatorScope } from "./Compiler/Frontend/Expression Parsing/OperatorScope";
import { OperatorScopeBuilder } from "./Compiler/Frontend/Expression Parsing/OperatorScopeBuilder";
import { IRCompiler } from "./Compiler/Frontend/IRCompilation/Compiler";
// import { IRCompiler } from "./Compiler/Frontend/IRCompilation/Compiler";
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
import { removeCopyStatements } from "./Compiler/IR/Optimization/CopyRemove";
import { removeUnused } from "./Compiler/IR/Optimization/RemoveUnused";
import { SSATransformer } from "./Compiler/IR/SSATransformer";
import * as JavaTarget from "./Compiler/Targets/JavaTarget/IRCompiler";
import * as WASMTarget from "./Compiler/Targets/WASMTarget/IRCompiler";
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
  /*const fileSystemProvider = new NodeNativeFileSystemProvider();
  const basePathString = path.resolve(process.argv[2] || "./").toString();
  const basePath = new Path(...basePathString.split("/"));
  const loader = new Loader(basePath, fileSystemProvider);
  loader.searchForSourceFilesInBasePath((file) => {
    console.log(file);
  });
  return;*/

  const basePathString = path.resolve(process.argv[2] || "./example/main.wok").toString();

  const content = await promisify(readFile)(basePathString || "testFile");
  const lexer = new Lexer(basePathString, content.toString());
  const parser = new Parser(lexer);
  const result = parser.parseSourceFile();
  const errorFormatter = new ErrorFormatter(lexer.sourceString, basePathString, parser.errors);

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

  if (process.argv.includes("--print-ast")) {
    process.stdout.write(result.toString());
  }
  if (parser.errors.length > 0) {
    process.stdout.write(errorFormatter.toString());
    return;
  }
  const dependencyAnalyzer = new DependencyAnalyzer(parser.errors);
  dependencyAnalyzer.analyze(result, globalTypeScope.typeProvider);
  if (process.argv.includes("--print-tasks")) {
    for (const task of dependencyAnalyzer.compilerTasks) {
      console.log(task.toString());
    }
  }
  const irCompiler = new IRCompiler(globalTypeScope, dependencyAnalyzer.compilerTasks);
  irCompiler.compile();
  const compilationUnit = irCompiler.compilationUnit;

  if (process.argv.includes("--print-ir")) {
    const irPrinter = new IRPrinter();
    const irString = irPrinter.stringifyCompilationUnit(compilationUnit);
    process.stderr.write(irString);
  }

  const ssaTransformer = new SSATransformer();
  const ssa = ssaTransformer.transformCompilationUnit(compilationUnit);
  if (true) { removeCopyStatements(ssa); }
  if (true) { removeUnused(ssa); }

  if (process.argv.includes("--print-ssa")) {
    const irPrinter = new IRPrinter();
    const irString = irPrinter.stringifyCompilationUnit(ssa);
    process.stdout.write(irString);
  }
  const target = process.argv.includes("--java") ? "java" : "wasm";
  if (target === "wasm") {
    const wasmModule = WASMTarget.compileIR(ssa);
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
  } else if (target === "java") {
    const javaSource = JavaTarget.compileIR(ssa, (name, java) => {
      if (name === "function_print") {
        java.writeLine("byte[] chars = new byte[a1];");
        java.writeLine("for (int i = 0; i < a1; i++) {");
        java.indent();
        java.writeLine("chars[i] = bb.get(a0 + i);");
        java.dedent();
        java.writeLine("}");
        java.writeLine("String s = new String(chars, StandardCharsets.UTF_8);");
        java.writeLine("System.out.print(s);");
      }
      if (name === "function_printInt") {
        java.writeLine("System.out.println(a0);");
      }
      if (name === "function_printUInt") {
        java.writeLine("System.out.println(a0);");
      }
    });
    process.stdout.write(javaSource);
  } else {
    process.stderr.write(chalk.red("Target was not defined.\n"));
  }

}
