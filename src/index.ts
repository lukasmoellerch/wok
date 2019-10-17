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
import { IInternalFunctionDeclaration, IInternalFunctionDefinition } from "./Compiler/IR/AST";
import { GraphAnalyzer } from "./Compiler/IR/GraphAnalyzer";
import { convertGraphToViz } from "./Compiler/IR/GraphFormatter";
import { IRPrinter } from "./Compiler/IR/IRPrinter";
import { transformToSSA } from "./Compiler/IR/NaiveSSAFromGraph";
import { removeCopyStatements } from "./Compiler/IR/Optimization/CopyRemove";
import { removeEmpty } from "./Compiler/IR/Optimization/RemoveEmptyBlocks";
import { removeUnused } from "./Compiler/IR/Optimization/RemoveUnused";
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
export function compile(content: string, target: "wasm" | "java" | "ssa" | "ir" | "ast" | "graph"): string {
  /*const fileSystemProvider = new NodeNativeFileSystemProvider();
  const basePathString = path.resolve(process.argv[2] || "./").toString();
  const basePath = new Path(...basePathString.split("/"));
  const loader = new Loader(basePath, fileSystemProvider);
  loader.searchForSourceFilesInBasePath((file) => {
    console.log(file);
  });
  return;*/

  const lexer = new Lexer("main.wok", content);
  const parser = new Parser(lexer);
  const result = parser.parseSourceFile();
  const errorFormatter = new ErrorFormatter(lexer.sourceString, "main.wok", parser.errors);
  try {
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
    variableScopeBuilder.buildScopes(globalVariableScope);

    const typeChecker = new TypeChecker(globalTypeScope, parser.errors);
    typeChecker.walkSourceFile(result);
    const implictConversionWrapper = new ImplictConversionWrapper();
    implictConversionWrapper.walkSourceFile(result);
    if (parser.errors.length > 0) {
      throw new Error(errorFormatter.toString());
    }
    if (target === "ast") {
      return result.toString();
    }
    const dependencyAnalyzer = new DependencyAnalyzer(parser.errors);
    dependencyAnalyzer.analyze(result, globalTypeScope.typeProvider);
    const irCompiler = new IRCompiler(globalTypeScope, dependencyAnalyzer.compilerTasks);
    irCompiler.compile();
    const compilationUnit = irCompiler.compilationUnit;
    if (target === "ir") {
      const irPrinter = new IRPrinter();
      return irPrinter.stringifyCompilationUnit(compilationUnit);
    }
    const graphBuilder = new GraphAnalyzer();
    let graphs = graphBuilder.analyzeCompilationUnit(compilationUnit);
    const identifierFunctionCodeMapping: Map<string, IInternalFunctionDefinition> = new Map();
    for (const definition of compilationUnit.functionCode) {
      identifierFunctionCodeMapping.set(definition.identifier, definition);
    }
    const identifierDeclarationMapping: Map<string, IInternalFunctionDeclaration> = new Map();
    for (const definition of compilationUnit.internalFunctionDeclarations) {
      identifierDeclarationMapping.set(definition.identifier, definition);
    }
    for (const [name, graph] of graphs) {
      const definition = identifierFunctionCodeMapping.get(name);
      if (definition === undefined) {
        throw new Error();
      }
      const declaration = identifierDeclarationMapping.get(name);
      if (declaration === undefined) {
        throw new Error();
      }
      transformToSSA(declaration, definition, graph, definition.code[0]);
    }
    removeCopyStatements(compilationUnit);
    removeUnused(compilationUnit);
    removeEmpty(compilationUnit);
    if (target === "graph") {
      let result = "";
      graphs = graphBuilder.analyzeCompilationUnit(compilationUnit);
      for (const [name, graph] of graphs) {
        const r = convertGraphToViz("G", compilationUnit, graph) + "\n";
        result += "<a href=\"https://dreampuf.github.io/GraphvizOnline/#" + encodeURIComponent(r) + `">${name}</a></br>\n`;
      }
      return result;
    }

    const ssa = compilationUnit;

    if (target === "ssa") {
      const irPrinter = new IRPrinter();
      return irPrinter.stringifyCompilationUnit(ssa);
    }

    if (target === "wasm") {
      const wasmModule = WASMTarget.compileIR(ssa);
      const consumer = new TypedArrayBytestreamConsumer();
      encodeModule(wasmModule, consumer);
      const encoded = consumer.cleanArray;
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
          },
        },
      });
      const memory = (instance.exports.memory as any).buffer as ArrayBuffer;
      (instance.exports as any)._start();
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
      return javaSource;
    } else {
      throw new Error();
    }
  } catch (e) {
    if (parser.errors.length > 0) {
      throw new Error(errorFormatter.toString());
    } else {
      throw e;
    }
  }
  throw new Error();
}
