import { Block, BlockType, ICompilationUnit } from "./AST";
import { IGraph } from "./GraphAnalyzer";
import { IRPrinter } from "./IRPrinter";

export function convertGraphToViz(name: string, compilationUnit: ICompilationUnit, graph: IGraph): string {
  let out = "";
  let i = 0;
  const blocks: Block[] = [];
  const blockIndexMapping: Map<Block, number> = new Map();
  function getIndex(block: Block) {
    const index = blockIndexMapping.get(block);
    if (index !== undefined) {
      return index;
    }
    blockIndexMapping.set(block, i);
    blocks.push(block);
    i++;
    return i - 1;
  }
  for (const block of graph.blocks) {
    getIndex(block);
  }
  const edges: Array<[number, number]> = [];
  for (const [a, other] of graph.aToB) {
    const aIndex = getIndex(a);
    for (const b of other) {
      const bIndex = getIndex(b);
      edges.push([aIndex, bIndex]);
    }
  }
  const irPrinter = new IRPrinter();
  irPrinter.compilationUnit = compilationUnit;
  function str(block: Block) {
    if (block.type === BlockType.basic) {
      return irPrinter.stringifyBlock("", block);
    } else if (block.type === BlockType.breakable) {
      return "breakable";
    } else if (block.type === BlockType.if) {
      return "if $" + block.condition;
    } else if (block.type === BlockType.ifelse) {
      return "ifelse $" + block.condition;
    } else if (block.type === BlockType.loop) {
      return "loop";
    }
    throw new Error();
  }
  out += `digraph ${name} {\n`;
  i = 0;
  for (const block of blocks) {
    out += `\tA${i}[label=${JSON.stringify(str(block))}, shape=box];\n`;
    i++;
  }
  for (const [a, b] of edges) {
    out += `\tA${a} -> A${b};\n`;
  }
  out += "}";
  return out;
}
