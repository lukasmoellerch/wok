import { readFile } from "fs";
import { promisify } from "util";
import { ExpressionParser } from "./Frontend/Expression Parsing/ExpressionParser";
import { OperatorScope } from "./Frontend/Expression Parsing/OperatorScope";
import { OperatorScopeBuilder } from "./Frontend/Expression Parsing/OperatorScopeBuilder";
import { Lexer } from "./Frontend/Lexer/Lexer";
import { ErrorFormatter } from "./Frontend/Parser/ErrorFormatter";
import { Parser } from "./Frontend/Parser/Parser";
import { TypeResolver } from "./Frontend/Type Scope/TypeResolver";
import { TypeScope } from "./Frontend/Type Scope/TypeScope";
import { TypeScopeBuilder } from "./Frontend/Type Scope/TypeScopeBuilder";
import { injectNativeTypes } from "./Frontend/Type/NativeTypeProvider";
import { ImplictConversionWrapper } from "./Frontend/TypeChecking/ImplictConversionWrapper";
import { TypeChecker } from "./Frontend/TypeChecking/TypeChecker";
import { VariableScope } from "./Frontend/VariableScope/VariableScope";
import { VariableScopeBuilder } from "./Frontend/VariableScope/VariableScopeBuilder";

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
  const globalTypeScope = new TypeScope();
  const globalVariableScope = new VariableScope();

  const typeScopeBuilder = new TypeScopeBuilder(result);
  const operatorScopeBuilder = new OperatorScopeBuilder(result, parser.errors);
  const variableScopeBuilder = new VariableScopeBuilder(result, parser.errors);
  const expressionParser = new ExpressionParser(result, parser.errors);
  const typeResolver = new TypeResolver(parser.errors);

  typeScopeBuilder.populateGlobalTypeScope(globalTypeScope);
  operatorScopeBuilder.populateGlobalOperatorScope(globalOperatorScope);
  variableScopeBuilder.populateGlobalVariableScope(globalVariableScope);
  injectNativeTypes(globalTypeScope);

  typeScopeBuilder.buildScopes();
  operatorScopeBuilder.buildScopes();
  expressionParser.parseExpressions();
  variableScopeBuilder.buildScopes();
  typeResolver.walkSourceFile(result);

  const typeChecker = new TypeChecker(parser.errors);
  typeChecker.walkSourceFile(result);
  const implictConversionWrapper = new ImplictConversionWrapper();
  implictConversionWrapper.walkSourceFile(result);

  console.log(result.toString("", true, true));
  console.log(errorFormatter.toString());
  // instance.exports.main(12);*/
}
