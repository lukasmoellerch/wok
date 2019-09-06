import { Block, BlockType, ICompilationUnit, InstructionType } from "../AST";
import { getStatementsInLinearOrder, mapReadVariables } from "../Utils";

export function removeCopyStatements(ir: ICompilationUnit) {
  for (const fn of ir.functionCode) {
    const copies: Map<number, number> = new Map();
    const blacklist: Set<number> = new Set();
    for (const statement of getStatementsInLinearOrder(fn.code)) {
      if (statement[0] === InstructionType.copy) {
        const [, a, b] = statement;
        if (!blacklist.has(a)) {
          copies.set(a, b);
        }
      }
      if (statement[0] === InstructionType.phi) {
        const [, , b] = statement;
        for (const variable of b) {
          blacklist.add(variable);
          copies.delete(variable);
        }
      }
    }
    function apply(a: number): number {
      const result = copies.get(a);
      return result || a;
    }
    function transform(code: Block[]) {
      for (const block of code) {
        if (block.type === BlockType.basic) {
          block.statements = block.statements.map((statement) => {
            return mapReadVariables(statement, apply);
          }).filter((statement) => {
            if (statement[0] === InstructionType.copy) {
              if (copies.has(statement[1])) {
                return false;
              }
            }
            return true;
          });
        } else if (block.type === BlockType.breakable) {
          transform(block.blocks);
        } else if (block.type === BlockType.loop) {
          transform(block.blocks);
        } else if (block.type === BlockType.if) {
          block.condition = apply(block.condition);
          transform(block.blocks);
        } else if (block.type === BlockType.ifelse) {
          block.condition = apply(block.condition);
          transform(block.true);
          transform(block.false);
        }
      }
    }
    transform(fn.code);
  }
}
