import { Block, BlockType, ICompilationUnit } from "../AST";

export function removeEmpty(ir: ICompilationUnit) {
  for (const fn of ir.functionCode) {
    function transform(code: Block[]) {
      for (const block of code) {
        if (block.type === BlockType.basic) {
          continue;
        } else if (block.type === BlockType.breakable) {
          block.blocks = block.blocks.filter((w) => {
            return w.type !== BlockType.basic || w.statements.length > 0;
          });
          transform(block.blocks);
        } else if (block.type === BlockType.loop) {
          block.blocks = block.blocks.filter((w) => {
            return w.type !== BlockType.basic || w.statements.length > 0;
          });
          transform(block.blocks);
        } else if (block.type === BlockType.if) {
          block.blocks = block.blocks.filter((w) => {
            return w.type !== BlockType.basic || w.statements.length > 0;
          });
          transform(block.blocks);
        } else if (block.type === BlockType.ifelse) {
          block.true = block.true.filter((w) => {
            return w.type !== BlockType.basic || w.statements.length > 0;
          });
          block.false = block.false.filter((w) => {
            return w.type !== BlockType.basic || w.statements.length > 0;
          });
          transform(block.true);
          transform(block.false);
        }
      }
    }
    transform(fn.code);
  }
}
