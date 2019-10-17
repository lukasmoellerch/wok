import chalk from "chalk";
import { Block, BlockType, ICompilationUnit, IExternalFunctionDeclaration, IInternalFunctionDeclaration, IMutableGlobal, InstructionType, MemoryIRType, SSAStatement, Type } from "./AST";
chalk.enabled = false;
export class IRPrinter {
  public compilationUnit: ICompilationUnit | undefined;
  public stringifyCompilationUnit(compilationUnit: ICompilationUnit): string {
    this.compilationUnit = compilationUnit;
    let buffer = "";
    for (const mutableGlobal of compilationUnit.mutableGlobals) {
      buffer += this.stringifyMutableGlobal(mutableGlobal) + "\n";
    }
    for (const externalFunctionDeclaration of compilationUnit.externalFunctionDeclarations) {
      buffer += this.stringifyExternalFunctionDeclaration(externalFunctionDeclaration) + "\n";
    }
    for (const internalFunctionDeclaration of compilationUnit.internalFunctionDeclarations) {
      buffer += this.stringifyInternalFunctionDeclaration(internalFunctionDeclaration) + "\n";
    }
    for (const code of compilationUnit.functionCode) {
      buffer += `func ${code.identifier} {\n`;
      buffer += `  ${code.variableTypes.map((a) => this.stringifyType(a)).join(", ")}\n`;
      buffer += this.stringifyBlockArray("  ", code.code);
      buffer += "}\n";
    }
    return buffer;
  }
  public stringifyBlockArray(prefix: string, blocks: Block[]): string {
    return blocks.map((block) => this.stringifyBlock(prefix, block)).join("");
  }
  public stringifyBlock(prefix: string, block: Block): string {
    if (block.type === BlockType.basic) {
      let buffer = "";
      for (const statement of block.statements) {
        buffer += prefix + this.stringifyStatement(statement) + "\n";
      }
      return buffer;
    } else if (block.type === BlockType.loop) {
      let buffer = "";
      buffer += prefix + "loop {\n";
      buffer += this.stringifyBlockArray(prefix + "  ", block.blocks);
      buffer += prefix + "}\n";
      return buffer;
    } else if (block.type === BlockType.breakable) {
      let buffer = "";
      buffer += prefix + "breakable {\n";
      buffer += this.stringifyBlockArray(prefix + "  ", block.blocks);
      buffer += prefix + "}\n";
      return buffer;
    } else if (block.type === BlockType.if) {
      let buffer = "";
      buffer += prefix + `if ${chalk.redBright("$" + block.condition)} {\n`;
      buffer += this.stringifyBlockArray(prefix + "  ", block.blocks);
      buffer += prefix + "}\n";
      return buffer;
    } else if (block.type === BlockType.ifelse) {
      let buffer = "";
      buffer += prefix + `if ${chalk.redBright("$" + block.condition)} {\n`;
      buffer += this.stringifyBlockArray(prefix + "  ", block.true);
      buffer += prefix + "} else {\n";
      buffer += this.stringifyBlockArray(prefix + "  ", block.false);
      buffer += prefix + "}\n";
      return buffer;
    }
    return "";
  }
  public stringifyType(type: Type): string {
    if (type === Type.ui32) {
      return chalk.yellowBright("ui32");
    } else if (type === Type.si32) {
      return chalk.yellowBright("si32");
    } else if (type === Type.ui64) {
      return chalk.yellowBright("ui64");
    } else if (type === Type.si64) {
      return chalk.yellowBright("si64");
    } else if (type === Type.f32) {
      return chalk.yellowBright("f32");
    } else if (type === Type.f64) {
      return chalk.yellowBright("f64");
    } else if (type === Type.funcptr) {
      return chalk.yellowBright("funcptr");
    } else if (type === Type.ptr) {
      return chalk.yellowBright("ptr");
    }
    throw new Error("Invlid type");
  }
  public stringifyMemoryType(type: MemoryIRType): string {
    if (type === MemoryIRType.ui8) {
      return chalk.yellowBright("ui8");
    } else if (type === MemoryIRType.si8) {
      return chalk.yellowBright("si8");
    } else if (type === MemoryIRType.ui16) {
      return chalk.yellowBright("ui16");
    } else if (type === MemoryIRType.si16) {
      return chalk.yellowBright("si16");
    } else if (type === MemoryIRType.ui32) {
      return chalk.yellowBright("ui32");
    } else if (type === MemoryIRType.si32) {
      return chalk.yellowBright("si32");
    } else if (type === MemoryIRType.ui64) {
      return chalk.yellowBright("ui64");
    } else if (type === MemoryIRType.si64) {
      return chalk.yellowBright("si64");
    } else if (type === MemoryIRType.f32) {
      return chalk.yellowBright("f32");
    } else if (type === MemoryIRType.f64) {
      return chalk.yellowBright("f64");
    } else if (type === MemoryIRType.funcptr) {
      return chalk.yellowBright("funcptr");
    } else if (type === MemoryIRType.ptr) {
      return chalk.yellowBright("ptr");
    }
    return "ERROR"
  }
  public stringifyMutableGlobal(mutableGlobal: IMutableGlobal): string {
    return `mutable global ${mutableGlobal.identifier}: ${mutableGlobal}`;
  }
  public stringifyInternalFunctionDeclaration(declaration: IInternalFunctionDeclaration): string {
    const attributes: string[] = [];
    const types: string[] = declaration.type[0].map(this.stringifyType);
    const resultTypes: string[] = declaration.type[1].map(this.stringifyType);
    return `function [${attributes}] ${declaration.identifier} (${types.join(", ")}) -> (${resultTypes.join(", ")})`;
  }
  public stringifyExternalFunctionDeclaration(declaration: IExternalFunctionDeclaration): string {
    const types: string[] = declaration.type[0].map(this.stringifyType);
    const resultTypes: string[] = declaration.type[1].map(this.stringifyType);
    return `import ${declaration.externalName} (${types.join(", ")}) -> (${resultTypes.join(", ")}) as ${declaration.identifier}`;
  }
  public stringifyStatement(statement: SSAStatement): string {
    if (statement[0] === InstructionType.phi) {
      return `${chalk.redBright("$" + statement[1])} = phi(${statement[2].map((a) => chalk.redBright(`$${a}`)).join(", ")})`;
    }
    if (statement[0] === InstructionType.break) {
      return chalk.redBright`break`;
    }
    if (statement[0] === InstructionType.breakIf) {
      return `breakIf ${chalk.redBright("$" + statement[1])}`;
    }
    if (statement[0] === InstructionType.breakIfFalse) {
      return `breakIfFalse ${chalk.redBright("$" + statement[1])}`;
    }
    if (statement[0] === InstructionType.call) {
      return `(${statement[2].map((a) => chalk.redBright(`$${a}`)).join(", ")}) = ${chalk.magentaBright(statement[1])}(${statement[3].map((a) => chalk.redBright(`$${a}`)).join(", ")})`;
    }
    if (statement[0] === InstructionType.callFunctionPointer) {
      return `(${statement[3].map((a) => chalk.redBright(`$${a}`)).join(", ")}) = ${chalk.redBright("$" + statement[2])}(${statement[4].map((a) => chalk.redBright(`$${a}`)).join(", ")})`;
    }
    if (statement[0] === InstructionType.setToConstant) {
      return `${chalk.redBright("$" + statement[1])} = ${chalk.green(statement[2] + "")}`;
    }
    if (statement[0] === InstructionType.setToFunction) {
      return `${chalk.redBright("$" + statement[1])} = &${statement[2]}`;
    }
    if (statement[0] === InstructionType.setToGlobal) {
      return `${chalk.redBright("$" + statement[1])} = @${statement[2]}`;
    }
    if (statement[0] === InstructionType.setToDataSegment) {
      const compilationUnit = this.compilationUnit;
      if (compilationUnit === undefined) {
        throw new Error();
      }
      const data = compilationUnit.dataSegments[statement[2]].content;
      const decoder = new TextDecoder("utf-8");
      const string = decoder.decode(data);
      return `${chalk.redBright("$" + statement[1])} = &` + chalk.blueBright("\"" + string + "\"");
    }
    if (statement[0] === InstructionType.copy) {
      return `${chalk.redBright("$" + statement[1])} = ${chalk.redBright("$" + statement[2])}`;
    }
    if (statement[0] === InstructionType.load) {
      return `${chalk.redBright("$" + statement[1])} = *((${this.stringifyMemoryType(statement[3])}*)${chalk.redBright("$" + statement[2])})`;
    }
    if (statement[0] === InstructionType.store) {
      return `*((${this.stringifyMemoryType(statement[3])}*)${chalk.redBright("$" + statement[1])}) = ${chalk.redBright("$" + statement[2])}`;
    }
    if (statement[0] === InstructionType.convert) {
      return `${chalk.redBright("$" + statement[1])} = (${this.stringifyType(statement[3])}) ${chalk.redBright("$" + statement[2])}`;
    }
    if (statement[0] === InstructionType.equalToZero) {
      return `${chalk.redBright("$" + statement[1])} = ${chalk.redBright("$" + statement[2])} == 0`;
    }
    if (statement[0] === InstructionType.equal) {
      return `${chalk.redBright("$" + statement[1])} = ${chalk.redBright("$" + statement[2])} == ${chalk.redBright("$" + statement[3])}`;
    }
    if (statement[0] === InstructionType.notEqual) {
      return `${chalk.redBright("$" + statement[1])} = ${chalk.redBright("$" + statement[2])} != ${chalk.redBright("$" + statement[3])}`;
    }
    if (statement[0] === InstructionType.less) {
      return `${chalk.redBright("$" + statement[1])} = ${chalk.redBright("$" + statement[2])} < ${chalk.redBright("$" + statement[3])}`;
    }
    if (statement[0] === InstructionType.greater) {
      return `${chalk.redBright("$" + statement[1])} = ${chalk.redBright("$" + statement[2])} > ${chalk.redBright("$" + statement[3])}`;
    }
    if (statement[0] === InstructionType.lessEqual) {
      return `${chalk.redBright("$" + statement[1])} = ${chalk.redBright("$" + statement[2])} <= ${chalk.redBright("$" + statement[3])}`;
    }
    if (statement[0] === InstructionType.greaterEqual) {
      return `${chalk.redBright("$" + statement[1])} = ${chalk.redBright("$" + statement[2])} >= ${chalk.redBright("$" + statement[3])}`;
    }
    if (statement[0] === InstructionType.countLeadingZeroes) {
      return `${chalk.redBright("$" + statement[1])} = clz(${chalk.redBright("$" + statement[2])})`;
    }
    if (statement[0] === InstructionType.countTrailingZeroes) {
      return `${chalk.redBright("$" + statement[1])} = ctz(${chalk.redBright("$" + statement[2])})`;
    }
    if (statement[0] === InstructionType.add) {
      return `${chalk.redBright("$" + statement[1])} = ${chalk.redBright("$" + statement[2])} + ${chalk.redBright("$" + statement[3])}`;
    }
    if (statement[0] === InstructionType.subtract) {
      return `${chalk.redBright("$" + statement[1])} = ${chalk.redBright("$" + statement[2])} - ${chalk.redBright("$" + statement[3])}`;
    }
    if (statement[0] === InstructionType.multiply) {
      return `${chalk.redBright("$" + statement[1])} = ${chalk.redBright("$" + statement[2])} * ${chalk.redBright("$" + statement[3])}`;
    }
    if (statement[0] === InstructionType.divide) {
      return `${chalk.redBright("$" + statement[1])} = ${chalk.redBright("$" + statement[2])} / ${chalk.redBright("$" + statement[3])}`;
    }
    if (statement[0] === InstructionType.remainder) {
      return `${chalk.redBright("$" + statement[1])} = ${chalk.redBright("$" + statement[2])} % ${chalk.redBright("$" + statement[3])}`;
    }
    if (statement[0] === InstructionType.and) {
      return `${chalk.redBright("$" + statement[1])} = ${chalk.redBright("$" + statement[2])} & ${chalk.redBright("$" + statement[3])}`;
    }
    if (statement[0] === InstructionType.or) {
      return `${chalk.redBright("$" + statement[1])} = ${chalk.redBright("$" + statement[2])} | ${chalk.redBright("$" + statement[3])}`;
    }
    if (statement[0] === InstructionType.xor) {
      return `${chalk.redBright("$" + statement[1])} = ${chalk.redBright("$" + statement[2])} ^ ${chalk.redBright("$" + statement[3])}`;
    }
    if (statement[0] === InstructionType.shiftLeft) {
      return `${chalk.redBright("$" + statement[1])} = ${chalk.redBright("$" + statement[2])} << ${chalk.redBright("$" + statement[3])}`;
    }
    if (statement[0] === InstructionType.shiftRight) {
      return `${chalk.redBright("$" + statement[1])} = ${chalk.redBright("$" + statement[2])} >> ${chalk.redBright("$" + statement[3])}`;
    }
    if (statement[0] === InstructionType.rotateleft) {
      return `${chalk.redBright("$" + statement[1])} = ${chalk.redBright("$" + statement[2])} rotl ${chalk.redBright("$" + statement[3])}`;
    }
    if (statement[0] === InstructionType.rotateRight) {
      return `${chalk.redBright("$" + statement[1])} = ${chalk.redBright("$" + statement[2])} rotr ${chalk.redBright("$" + statement[3])}`;
    }
    if (statement[0] === InstructionType.absolute) {
      return `${chalk.redBright("$" + statement[1])} = abs(${chalk.redBright("$" + statement[2])})`;
    }
    if (statement[0] === InstructionType.negate) {
      return `${chalk.redBright("$" + statement[1])} = -${chalk.redBright("$" + statement[2])}`;
    }
    if (statement[0] === InstructionType.floor) {
      return `${chalk.redBright("$" + statement[1])} = floor(${chalk.redBright("$" + statement[2])})`;
    }
    if (statement[0] === InstructionType.truncate) {
      return `${chalk.redBright("$" + statement[1])} = trunc(${chalk.redBright("$" + statement[2])})`;
    }
    if (statement[0] === InstructionType.nearest) {
      return `${chalk.redBright("$" + statement[1])} = nearest(${chalk.redBright("$" + statement[2])})`;
    }
    if (statement[0] === InstructionType.sqrt) {
      return `${chalk.redBright("$" + statement[1])} = sqrt(${chalk.redBright("$" + statement[2])})`;
    }
    if (statement[0] === InstructionType.minimum) {
      return `${chalk.redBright("$" + statement[1])} = min(${chalk.redBright("$" + statement[2])}, ${chalk.redBright("$" + statement[3])})`;
    }
    if (statement[0] === InstructionType.maximum) {
      return `${chalk.redBright("$" + statement[1])} = max(${chalk.redBright("$" + statement[2])}, ${chalk.redBright("$" + statement[3])})`;
    }
    if (statement[0] === InstructionType.return) {
      return `return (${statement[1].map((a) => chalk.redBright(`$${a}`)).join(", ")})`;
    }
    return "";
  }
}
