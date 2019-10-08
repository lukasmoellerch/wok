import { Block, BlockType, FunctionType, ICompilationUnit, InstructionType, MemoryIRType, Type } from "../../IR/AST";
import { getStatementsInLinearOrder, getWrittenVariables } from "../WASMTarget/Utils";
type FunctionIdentifier = string;
class JavaWriter {
  public buffer: string;
  public indentation: number;
  public prefix: string;
  constructor() {
    this.buffer = "";
    this.indentation = 0;
    this.prefix = "";
  }
  public writeLine(str: string) {
    this.buffer += this.prefix + str + "\n";
  }
  public indent() {
    this.indentation += 1;
    this.recalcPrefix();
  }
  public dedent() {
    this.indentation -= 1;
    this.recalcPrefix();
  }
  public recalcPrefix() {
    this.prefix = "";
    for (let i = 0; i < this.indentation; i++) {
      this.prefix += "  ";
    }
  }
}
const adjectives = `deterministic
constant
undeclared
randomized
predictable
static
iterative
final
recursive
unbound
captured
optional
simple
complex
temporary
computed`.split("\n");
const nouns = `pointer
reference
property
declaration
value
constant
global
object
instance
local
array
collection
matrix`.split("\n");
function getVariableName() {
  if (Math.random() < 0.5) {
    return String.fromCharCode(97 + (Math.random() * 10 + 16 | 0));
  }
  const adjs = (Math.random() * 3) | 0;
  const s = new Set(adjectives);
  let result = "";
  let first = true;
  for (let j = 0; j < adjs; j++) {
    let random = [...s][(Math.random() * s.size) | 0];
    s.delete(random);
    if (first) {
      first = false;
    } else {
      random = random[0].toUpperCase() + random.substr(1);
    }
    result += random;
  }
  if (!first) {
    const q = nouns[Math.random() * nouns.length | 0];
    result += q[0].toUpperCase() + q.substr(1);
  } else {
    result += nouns[Math.random() * nouns.length | 0];
  }
  if (Math.random() < 0.02) {
    return result.toUpperCase();
  }
  return result;
}
export function compileIR(ir: ICompilationUnit, writeExternal: (name: string, java: JavaWriter) => void): string {
  const java = new JavaWriter();

  const functionIdentifierIndexMapping: Map<FunctionIdentifier, number> = new Map();
  let i = 0;
  for (const externalFunctionDeclaration of ir.externalFunctionDeclarations) {
    functionIdentifierIndexMapping.set(externalFunctionDeclaration.identifier, i);
    i++;
  }
  for (const internalFunctionDeclaration of ir.internalFunctionDeclarations) {
    functionIdentifierIndexMapping.set(internalFunctionDeclaration.identifier, i);
    i++;
  }

  const functionIdentifierTableIndexMapping: Map<FunctionIdentifier, number> = new Map();
  i = 0;
  const tableFunctionIdentifierArray: FunctionIdentifier[] = [];
  for (const externalFunctionDeclaration of ir.externalFunctionDeclarations) {
    if (externalFunctionDeclaration.tableElement) {
      functionIdentifierTableIndexMapping.set(externalFunctionDeclaration.identifier, i);
      i++;
      tableFunctionIdentifierArray.push(externalFunctionDeclaration.identifier);
    }
  }
  for (const internalFunctionDeclaration of ir.internalFunctionDeclarations) {
    if (internalFunctionDeclaration.tableElement) {
      functionIdentifierTableIndexMapping.set(internalFunctionDeclaration.identifier, i);
      i++;
      tableFunctionIdentifierArray.push(internalFunctionDeclaration.identifier);
    }
  }
  const functionIdentifierTypeMapping: Map<FunctionIdentifier, FunctionType> = new Map();
  for (const internalFunctionDeclaration of ir.internalFunctionDeclarations) {
    functionIdentifierTypeMapping.set(internalFunctionDeclaration.identifier, internalFunctionDeclaration.type);
  }
  for (const externalFunctionDeclaration of ir.externalFunctionDeclarations) {
    functionIdentifierTypeMapping.set(externalFunctionDeclaration.identifier, externalFunctionDeclaration.type);
  }
  java.writeLine("import java.nio.*;");
  java.writeLine("import java.util.*;");
  java.writeLine("import java.nio.charset.StandardCharsets;");
  java.writeLine("public class Main {");
  java.indent();
  java.writeLine("public static ByteBuffer bb;");
  let iCount = 0;
  let lCount = 0;
  for (const declaration of functionIdentifierTypeMapping.values()) {
    const ret = declaration[1].slice(1);
    let ints = 0;
    let longs = 0;
    for (const returnType of ret) {
      const javaType = mapIRTypeToJavaType(returnType);
      if (javaType === "int") {
        ints++;
      } else if (javaType === "long") {
        longs++;
      }
    }
    for (let k = iCount; k < ints; k++) {
      java.writeLine("private static int " + "reti" + k + ";");
      iCount++;
    }
    for (let k = lCount; k < longs; k++) {
      java.writeLine("private static long " + "retl" + k + ";");
      lCount++;
    }
  }
  java.writeLine("public static void main(String[] args){");
  java.indent();
  java.writeLine("bb = ByteBuffer.allocate(1024);");
  let offset = 0;
  const segmentOffsets: number[] = [];
  let index = 0;
  for (const segment of ir.dataSegments) {
    java.writeLine(`bb.put(new byte[]{${segment.content.toString()}});`);
    segmentOffsets[index] = offset;
    offset += segment.content.length;
    index++;
  }
  java.writeLine("_start();");
  java.dedent();
  java.writeLine("}");
  for (const externalFunctionDeclaration of ir.externalFunctionDeclarations) {
    const name = externalFunctionDeclaration.identifier;
    const type = functionIdentifierTypeMapping.get(name);
    if (type === undefined) {
      throw new Error();
    }
    java.writeLine(`private static ${mapIRTypeToJavaType(type[1][0])} ${name} (${type[0].map((t, q) => (mapIRTypeToJavaType(t) + " a" + q)).join(", ")}){`);
    java.indent();
    writeExternal(name, java);
    java.dedent();
    java.writeLine("}");
  }
  for (const code of ir.functionCode) {
    const phiNodeMapping: Map<number, number[]> = new Map();
    for (const statement of getStatementsInLinearOrder(code.code)) {
      if (statement[0] === InstructionType.phi) {
        const target = statement[1];
        const others = statement[2];
        for (const other of others) {
          const array = phiNodeMapping.get(other);
          if (array === undefined) {
            phiNodeMapping.set(other, [target]);
          } else {
            if (array.indexOf(target) !== -1) {
              continue;
            }
            array.push(target);
          }
        }
      }
    }
    const identifier = code.identifier;
    const type = functionIdentifierTypeMapping.get(identifier);
    if (type === undefined) {
      throw new Error();
    }
    const variableNames: string[] = [];
    const usedNames: Set<string> = new Set();
    let i = 0;
    for (i = 0; i < type[0].length; i++) {
      let name: string = "";
      do {
        name = getVariableName();
      } while (name === "" || usedNames.has(name));
      usedNames.add(name);
      variableNames.push(name);
    }
    java.writeLine(`private static ${mapIRTypeToJavaType(type[1][0])} ${identifier}(${type[0].map((t, q) => (mapIRTypeToJavaType(t) + " " + variableNames[q])).join(", ")}){`);
    java.indent();
    for (const _argType of type[0]) {
      i++;
    }
    const declarationsPerType: Map<string, string[]> = new Map();
    for (const local of code.variableTypes) {
      let name: string = "";
      do {
        name = getVariableName();
      } while (name === "" || usedNames.has(name));
      usedNames.add(name);
      variableNames.push(name);
      const javaType = mapIRTypeToJavaType(local);
      const array = declarationsPerType.get(javaType);
      if (array === undefined) {
        declarationsPerType.set(javaType, [name]);
      } else {
        array.push(name);
      }
      i++;
    }
    for (const [t, names] of declarationsPerType.entries()) {
      java.writeLine(`${t} ${names.join(", ")};`);
    }
    const breakType: string[] = [];
    function compile(blocks: Block[]) {
      for (const block of blocks) {
        if (block.type === BlockType.basic) {
          for (const statement of block.statements) {
            if (statement[0] === InstructionType.break) {
              java.writeLine(`${breakType[breakType.length - 1]};`);
            }
            if (statement[0] === InstructionType.breakIf) {
              java.writeLine(`if(0 != ${variableNames[statement[1]]}){`);
              java.indent();
              java.writeLine(`${breakType[breakType.length - 1]};`);
              java.dedent();
              java.writeLine("}");
            }
            if (statement[0] === InstructionType.breakIfFalse) {
              java.writeLine(`if(0 == ${variableNames[statement[1]]}){`);
              java.indent();
              java.writeLine(`${breakType[breakType.length - 1]};`);
              java.dedent();
              java.writeLine("}");
            }
            if (statement[0] === InstructionType.call) {
              const res = statement[2];
              const functionType = functionIdentifierTypeMapping.get(statement[1]);
              if (functionType === undefined) {
                throw new Error();
              }
              if (res.length === 0) {
                java.writeLine(`${statement[1]}(${statement[3].map((a) => variableNames[a]).join(", ")});`);
              } else {
                const first = res[0];
                java.writeLine(`${variableNames[first]} = ${statement[1]}(${statement[3].map((a) => variableNames[a]).join(", ")});`);
                let ints = 0;
                let longs = 0;
                for (let c = 1; c < functionType[1].length; c++) {
                  const t = functionType[1][c];
                  const javaType = mapIRTypeToJavaType(t);
                  const varName = variableNames[res[c]];
                  if (javaType === "int") {
                    java.writeLine(`${varName} = reti${ints};`);
                    ints++;
                  } else if (javaType === "long") {
                    java.writeLine(`${varName} = retl${longs};`);
                    longs++;
                  }
                }
              }
            }
            if (statement[0] === InstructionType.callFunctionPointer) {
              java.writeLine(``);
            }
            if (statement[0] === InstructionType.setToConstant) {
              java.writeLine(`${variableNames[statement[1]]} = ${statement[2]};`);
            }
            if (statement[0] === InstructionType.setToFunction) {
              java.writeLine(`${variableNames[statement[1]]} = ${statement[2]};`);
            }
            if (statement[0] === InstructionType.setToGlobal) {
              if (statement[2] === "HEAP_START") {
                java.writeLine(`${variableNames[statement[1]]} = ${offset};`);
              }
            }
            if (statement[0] === InstructionType.setToDataSegment) {
              java.writeLine(`${variableNames[statement[1]]} = ${segmentOffsets[statement[2]]};`);
            }
            if (statement[0] === InstructionType.copy) {
              java.writeLine(`${variableNames[statement[1]]} = ${variableNames[statement[2]]};`);
            }
            if (statement[0] === InstructionType.load) {
              const t = statement[3];
              if (t === MemoryIRType.si8 || t === MemoryIRType.ui8) {
                java.writeLine(`${variableNames[statement[1]]} = bb.getChar(${variableNames[statement[2]]});`);
              }
              if (t === MemoryIRType.si16 || t === MemoryIRType.ui16) {
                java.writeLine(`${variableNames[statement[1]]} = bb.getShort(${variableNames[statement[2]]});`);
              }
              if (t === MemoryIRType.si32 || t === MemoryIRType.ui32 || t === MemoryIRType.funcptr || t === MemoryIRType.ptr) {
                java.writeLine(`${variableNames[statement[1]]} = bb.getInt(${variableNames[statement[2]]});`);
              }
              if (t === MemoryIRType.si64 || t === MemoryIRType.ui64) {
                java.writeLine(`${variableNames[statement[1]]} = bb.getLong(${variableNames[statement[2]]});`);
              }
            }
            if (statement[0] === InstructionType.store) {
              const t = statement[3];
              if (t === MemoryIRType.si8 || t === MemoryIRType.ui8) {
                java.writeLine(`bb.putChar(${variableNames[statement[1]]}, ${variableNames[statement[2]]});`);
              }
              if (t === MemoryIRType.si16 || t === MemoryIRType.ui16) {
                java.writeLine(`bb.putShort(${variableNames[statement[1]]}, ${variableNames[statement[2]]});`);
              }
              if (t === MemoryIRType.si32 || t === MemoryIRType.ui32 || t === MemoryIRType.funcptr || t === MemoryIRType.ptr) {
                java.writeLine(`bb.putInt(${variableNames[statement[1]]}, ${variableNames[statement[2]]});`);
              }
              if (t === MemoryIRType.si64 || t === MemoryIRType.ui64) {
                java.writeLine(`bb.putLong(${variableNames[statement[1]]}, ${variableNames[statement[2]]});`);
              }
            }
            if (statement[0] === InstructionType.convert) {
              java.writeLine(`${variableNames[statement[1]]} = (${mapIRTypeToJavaType(statement[3])})${variableNames[statement[2]]};`);
            }
            if (statement[0] === InstructionType.equalToZero) {
              java.writeLine(`${variableNames[statement[1]]} = (${variableNames[statement[2]]} == 0);`);
            }
            if (statement[0] === InstructionType.equal) {
              java.writeLine(`${variableNames[statement[1]]} = (${variableNames[statement[2]]} == ${variableNames[statement[3]]}) ? 1 : 0;`);
            }
            if (statement[0] === InstructionType.notEqual) {
              java.writeLine(`${variableNames[statement[1]]} = (${variableNames[statement[2]]} != ${variableNames[statement[3]]}) ? 1 : 0;`);
            }
            if (statement[0] === InstructionType.less) {
              java.writeLine(`${variableNames[statement[1]]} = (${variableNames[statement[2]]} < ${variableNames[statement[3]]}) ? 1 : 0;`);
            }
            if (statement[0] === InstructionType.greater) {
              java.writeLine(`${variableNames[statement[1]]} = (${variableNames[statement[2]]} > ${variableNames[statement[3]]}) ? 1 : 0;`);
            }
            if (statement[0] === InstructionType.lessEqual) {
              java.writeLine(`${variableNames[statement[1]]} = (${variableNames[statement[2]]} <= ${variableNames[statement[3]]}) ? 1 : 0;`);
            }
            if (statement[0] === InstructionType.greaterEqual) {
              java.writeLine(`${variableNames[statement[1]]} = (${variableNames[statement[2]]} >= ${variableNames[statement[3]]}) ? 1 : 0;`);
            }
            if (statement[0] === InstructionType.countLeadingZeroes) {
              continue;
            }
            if (statement[0] === InstructionType.countTrailingZeroes) {
              continue;
            }
            if (statement[0] === InstructionType.add) {
              java.writeLine(`${variableNames[statement[1]]} = ${variableNames[statement[2]]} + ${variableNames[statement[3]]};`);
            }
            if (statement[0] === InstructionType.subtract) {
              java.writeLine(`${variableNames[statement[1]]} = ${variableNames[statement[2]]} - ${variableNames[statement[3]]};`);
            }
            if (statement[0] === InstructionType.multiply) {
              java.writeLine(`${variableNames[statement[1]]} = ${variableNames[statement[2]]} * ${variableNames[statement[3]]};`);
            }
            if (statement[0] === InstructionType.divide) {
              java.writeLine(`${variableNames[statement[1]]} = ${variableNames[statement[2]]} / ${variableNames[statement[3]]};`);
            }
            if (statement[0] === InstructionType.remainder) {
              java.writeLine(`${variableNames[statement[1]]} = ${variableNames[statement[2]]} % ${variableNames[statement[3]]};`);
            }
            if (statement[0] === InstructionType.and) {
              java.writeLine(`${variableNames[statement[1]]} = ${variableNames[statement[2]]} & ${variableNames[statement[3]]};`);
            }
            if (statement[0] === InstructionType.or) {
              java.writeLine(`${variableNames[statement[1]]} = ${variableNames[statement[2]]} | ${variableNames[statement[3]]};`);
            }
            if (statement[0] === InstructionType.xor) {
              java.writeLine(`${variableNames[statement[1]]} = ${variableNames[statement[2]]} ^ ${variableNames[statement[3]]};`);
            }
            if (statement[0] === InstructionType.shiftLeft) {
              java.writeLine(`${variableNames[statement[1]]} = ${variableNames[statement[2]]} << ${variableNames[statement[3]]};`);
            }
            if (statement[0] === InstructionType.shiftRight) {
              java.writeLine(`${variableNames[statement[1]]} = ${variableNames[statement[2]]} >> ${variableNames[statement[3]]};`);
            }
            if (statement[0] === InstructionType.rotateleft) {
              continue;
            }
            if (statement[0] === InstructionType.rotateRight) {
              continue;
            }
            if (statement[0] === InstructionType.absolute) {
              java.writeLine(`${variableNames[statement[1]]} = abs(${variableNames[statement[2]]});`);
            }
            if (statement[0] === InstructionType.negate) {
              java.writeLine(`${variableNames[statement[1]]} = -${variableNames[statement[2]]};`);
            }
            if (statement[0] === InstructionType.floor) {
              java.writeLine(`${variableNames[statement[1]]} = floor(${variableNames[statement[2]]});`);
            }
            if (statement[0] === InstructionType.truncate) {
              continue;
            }
            if (statement[0] === InstructionType.nearest) {
              java.writeLine(`${variableNames[statement[1]]} = round(${variableNames[statement[2]]});`);
            }
            if (statement[0] === InstructionType.sqrt) {
              java.writeLine(`${variableNames[statement[1]]} = sqrt(${variableNames[statement[2]]});`);
            }
            if (statement[0] === InstructionType.minimum) {
              continue;
            }
            if (statement[0] === InstructionType.maximum) {
              continue;
            }
            if (statement[0] === InstructionType.return) {
              const functionType = functionIdentifierTypeMapping.get(identifier);
              if (functionType === undefined) {
                throw new Error();
              }
              const values = statement[1];
              if (values.length === 0) {
                java.writeLine("return;");
              } else {
                const first = values[0];

                let ints = 0;
                let longs = 0;
                for (let c = 1; c < functionType[1].length; c++) {
                  const t = functionType[1][c];
                  const javaType = mapIRTypeToJavaType(t);
                  const varName = variableNames[values[c]];
                  if (javaType === "int") {
                    java.writeLine(`reti${ints} = ${varName};`);
                    ints++;
                  } else if (javaType === "long") {
                    java.writeLine(`retl${longs} = ${varName};`);
                    longs++;
                  }
                }
                java.writeLine(`return ${variableNames[first]};`);
              }

            }
            const written = getWrittenVariables(statement);
            for (const variable of written) {
              const array = phiNodeMapping.get(variable);
              if (array !== undefined) {
                for (const target of array) {
                  java.writeLine(`${variableNames[target]} = ${variableNames[variable]};`);
                }
              }
            }
          }
        } else if (block.type === BlockType.breakable) {
          java.writeLine("do {");
          java.indent();
          breakType.push("break");
          compile(block.blocks);
          breakType.pop();
          java.dedent();
          java.writeLine("} while (false);");
        } else if (block.type === BlockType.if) {
          java.writeLine(`if (0 != ${variableNames[block.condition]}){`);
          java.indent();
          compile(block.blocks);
          java.dedent();
          java.writeLine("}");
          continue;
        } else if (block.type === BlockType.ifelse) {
          java.writeLine(`if (0 != ${variableNames[block.condition]}){`);
          java.indent();
          compile(block.true);
          java.dedent();
          java.writeLine("} else {");
          java.indent();
          compile(block.false);
          java.writeLine("}");
          continue;
        } else if (block.type === BlockType.loop) {
          java.writeLine("while (true) {");
          java.indent();
          breakType.push("continue");
          compile(block.blocks);
          breakType.pop();
          java.writeLine("break;");
          java.dedent();
          java.writeLine("}");
          continue;
        }
      }
    }
    compile(code.code);
    java.dedent();
    java.writeLine("}");
  }

  java.dedent();
  java.writeLine("}");

  return java.buffer;
}
function mapIRTypeToJavaType(ir: Type): string {
  if (ir === Type.ui32) {
    return "int";
  } else if (ir === Type.si32) {
    return "int";
  } else if (ir === Type.ui64) {
    return "long";
  } else if (ir === Type.si64) {
    return "long";
  } else if (ir === Type.f32) {
    return "float";
  } else if (ir === Type.f64) {
    return "double";
  } else if (ir === Type.ptr) {
    return "int";
  } else if (ir === Type.funcptr) {
    return "int";
  }
  return "void";
}
