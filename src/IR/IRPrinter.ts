import { Block, BlockType, ICompilationUnit, IExternalFunctionDeclaration, IInternalFunctionDeclaration, IMutableGlobal, InstructionType, SSAStatement, Type } from "./AST";

export class IRPrinter {
  public stringifyCompilationUnit(compilationUnit: ICompilationUnit): string {
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
      buffer += `function ${code.identifier} {\n`;
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
      buffer += prefix + `if $${block.condition} {\n`;
      buffer += this.stringifyBlockArray(prefix + "  ", block.blocks);
      buffer += prefix + "}\n";
      return buffer;
    } else if (block.type === BlockType.ifelse) {
      let buffer = "";
      buffer += prefix + `if $${block.condition} {\n`;
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
      return "ui32";
    } else if (type === Type.si32) {
      return "si32";
    } else if (type === Type.ui64) {
      return "ui64";
    } else if (type === Type.si64) {
      return "si64";
    } else if (type === Type.f32) {
      return "f32";
    } else if (type === Type.f64) {
      return "f64";
    } else if (type === Type.funcptr) {
      return "funcptr";
    } else if (type === Type.ptr) {
      return "ptr";
    }
    throw new Error("Invlid type");
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
      return `$${statement[1]} = phi(${statement[2].map((a) => `$${a}`).join(", ")})`;
    }
    if (statement[0] === InstructionType.break) {
      return `break`;
    }
    if (statement[0] === InstructionType.breakIf) {
      return `breakIf $${statement[1]}`;
    }
    if (statement[0] === InstructionType.breakIfFalse) {
      return `breakIfFalse $${statement[1]}`;
    }
    if (statement[0] === InstructionType.call) {
      return `(${statement[2].map((a) => `$${a}`).join(", ")}) = ${statement[1]}(${statement[3].map((a) => `$${a}`).join(", ")})`;
    }
    if (statement[0] === InstructionType.callFunctionPointer) {
      return `(${statement[3].map((a) => `$${a}`).join(", ")}) = $${statement[2]}(${statement[4].map((a) => `$${a}`).join(", ")})`;
    }
    if (statement[0] === InstructionType.setToConstant) {
      return `$${statement[1]} = ${statement[2]}`;
    }
    if (statement[0] === InstructionType.setToFunction) {
      return `$${statement[1]} = &${statement[2]}`;
    }
    if (statement[0] === InstructionType.setToGlobal) {
      return `$${statement[1]} = @${statement[2]}`;
    }
    if (statement[0] === InstructionType.setToDataSegment) {
      return `$${statement[1]} = dataSegment[${statement[2]}]`;
    }
    if (statement[0] === InstructionType.copy) {
      return `$${statement[1]} = $${statement[2]}`;
    }
    if (statement[0] === InstructionType.load) {
      return `$${statement[1]} = *((${this.stringifyType(statement[3])}*)$${statement[2]})`;
    }
    if (statement[0] === InstructionType.store) {
      return `*((${this.stringifyType(statement[3])}*)$${statement[1]}) = $${statement[2]}`;
    }
    if (statement[0] === InstructionType.convert) {
      return `$${statement[1]} = (${this.stringifyType(statement[3])}) $${statement[2]}`;
    }
    if (statement[0] === InstructionType.equalToZero) {
      return `$${statement[1]} = $${statement[2]} == 0`;
    }
    if (statement[0] === InstructionType.equal) {
      return `$${statement[1]} = $${statement[2]} == $${statement[3]}`;
    }
    if (statement[0] === InstructionType.notEqual) {
      return `$${statement[1]} = $${statement[2]} != $${statement[3]}`;
    }
    if (statement[0] === InstructionType.less) {
      return `$${statement[1]} = $${statement[2]} < $${statement[3]}`;
    }
    if (statement[0] === InstructionType.greater) {
      return `$${statement[1]} = $${statement[2]} > $${statement[3]}`;
    }
    if (statement[0] === InstructionType.lessEqual) {
      return `$${statement[1]} = $${statement[2]} <= $${statement[3]}`;
    }
    if (statement[0] === InstructionType.greaterEqual) {
      return `$${statement[1]} = $${statement[2]} >= $${statement[3]}`;
    }
    if (statement[0] === InstructionType.countLeadingZeroes) {
      return `$${statement[1]} = clz($${statement[2]})`;
    }
    if (statement[0] === InstructionType.countTrailingZeroes) {
      return `$${statement[1]} = ctz($${statement[2]})`;
    }
    if (statement[0] === InstructionType.add) {
      return `$${statement[1]} = $${statement[2]} + $${statement[3]}`;
    }
    if (statement[0] === InstructionType.subtract) {
      return `$${statement[1]} = $${statement[2]} - $${statement[3]}`;
    }
    if (statement[0] === InstructionType.multiply) {
      return `$${statement[1]} = $${statement[2]} * $${statement[3]}`;
    }
    if (statement[0] === InstructionType.divide) {
      return `$${statement[1]} = $${statement[2]} / $${statement[3]}`;
    }
    if (statement[0] === InstructionType.remainder) {
      return `$${statement[1]} = $${statement[2]} % $${statement[3]}`;
    }
    if (statement[0] === InstructionType.and) {
      return `$${statement[1]} = $${statement[2]} & $${statement[3]}`;
    }
    if (statement[0] === InstructionType.or) {
      return `$${statement[1]} = $${statement[2]} | $${statement[3]}`;
    }
    if (statement[0] === InstructionType.xor) {
      return `$${statement[1]} = $${statement[2]} ^ $${statement[3]}`;
    }
    if (statement[0] === InstructionType.shiftLeft) {
      return `$${statement[1]} = $${statement[2]} << $${statement[3]}`;
    }
    if (statement[0] === InstructionType.shiftRight) {
      return `$${statement[1]} = $${statement[2]} >> $${statement[3]}`;
    }
    if (statement[0] === InstructionType.rotateleft) {
      return `$${statement[1]} = $${statement[2]} rotl $${statement[3]}`;
    }
    if (statement[0] === InstructionType.rotateRight) {
      return `$${statement[1]} = $${statement[2]} rotr $${statement[3]}`;
    }
    if (statement[0] === InstructionType.absolute) {
      return `$${statement[1]} = abs($${statement[2]})`;
    }
    if (statement[0] === InstructionType.negate) {
      return `$${statement[1]} = -$${statement[2]}`;
    }
    if (statement[0] === InstructionType.floor) {
      return `$${statement[1]} = floor($${statement[2]})`;
    }
    if (statement[0] === InstructionType.truncate) {
      return `$${statement[1]} = trunc($${statement[2]})`;
    }
    if (statement[0] === InstructionType.nearest) {
      return `$${statement[1]} = nearest($${statement[2]})`;
    }
    if (statement[0] === InstructionType.sqrt) {
      return `$${statement[1]} = sqrt($${statement[2]})`;
    }
    if (statement[0] === InstructionType.minimum) {
      return `$${statement[1]} = min($${statement[2]}, $${statement[3]})`;
    }
    if (statement[0] === InstructionType.maximum) {
      return `$${statement[1]} = max($${statement[2]}, $${statement[3]})`;
    }
    if (statement[0] === InstructionType.return) {
      return `return (${statement[1].map((a) => `$${a}`).join(", ")})`;
    }
    return "";
  }
}
