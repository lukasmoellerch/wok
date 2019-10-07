import { getReadVariables, getStatementsInLinearOrder, getWrittenVariables } from "../../Targets/WASMTarget/Utils";
import { Block, BlockType, ICompilationUnit, InstructionType } from "../AST";

export function removeUnused(ir: ICompilationUnit) {
  for (const fn of ir.functionCode) {
    const used: Set<number> = new Set();
    for (const statement of getStatementsInLinearOrder(fn.code)) {
      const read = getReadVariables(statement);
      for (const v of read) {
        used.add(v);
        if (v === 15) {
          debugger;
        }
      }
    }
    function search(code: Block[]) {
      for (const block of code) {
        if (block.type === BlockType.breakable) {
          search(block.blocks);
        } else if (block.type === BlockType.loop) {
          search(block.blocks);
        } else if (block.type === BlockType.if) {
          used.add(block.condition);
          search(block.blocks);
        } else if (block.type === BlockType.ifelse) {
          used.add(block.condition);
          search(block.true);
          search(block.false);
        }
      }
    }
    search(fn.code);
    function transform(code: Block[]) {
      for (const block of code) {
        if (block.type === BlockType.basic) {
          block.statements = block.statements.filter((statement) => {
            const written = new Set(getWrittenVariables(statement));
            const int = new Set([...used].filter((i) => written.has(i)));
            if (written.size === 0) {
              return true;
            }
            if (int.size === 0) {
              const type = statement[0];
              if (type === InstructionType.call) {
                return true;
              }
              if (type === InstructionType.callFunctionPointer) {
                return true;
              }
              if (type === InstructionType.return) {
                return true;
              }
              if (type === InstructionType.break) {
                return true;
              }
              if (type === InstructionType.breakIf) {
                return true;
              }
              if (type === InstructionType.breakIfFalse) {
                return true;
              }
              if (type === InstructionType.store) {
                return true;
              }
              return false;
            }
            return true;
          });
        } else if (block.type === BlockType.breakable) {
          transform(block.blocks);
        } else if (block.type === BlockType.loop) {
          transform(block.blocks);
        } else if (block.type === BlockType.if) {
          transform(block.blocks);
        } else if (block.type === BlockType.ifelse) {
          transform(block.true);
          transform(block.false);
        }
      }
    }
    transform(fn.code);
  }
}
