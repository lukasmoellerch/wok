import { Block } from "./AST";
import { IGraph } from "./GraphAnalyzer";

export function simpleFastDominanceAlgorithm(graph: IGraph, start: Block): IGraph {
  const blocks: Set<Block> = graph.blocks;
  const preds: Map<Block, Set<Block>> = new Map();
  let c = true;
  while (c) {
    c = false;
    for (const block of blocks) {
      const p = preds.get(block);
      let predsSet: Set<Block>;
      if (p === undefined) {
        predsSet = new Set();
        preds.set(block, predsSet);
      } else {
        predsSet = p;
      }
      const orig = new Set([...predsSet]);
      for (const pred of predsSet) {
        predsSet = union(predsSet, graph.bToA.get(pred) || new Set());
      }
      predsSet = union(predsSet, graph.bToA.get(block) || new Set());
      preds.set(block, predsSet);
      if (!equal(predsSet, orig)) {
        c = true;
      }
    }
  }
  function intersection<T>(a: Set<T>, b: Set<T>): Set<T> {
    return new Set([...a].filter((x) => b.has(x)));
  }
  function difference<T>(a: Set<T>, b: Set<T>): Set<T> {
    return new Set([...a].filter((x) => !b.has(x)));
  }
  function union<T>(a: Set<T>, b: Set<T>): Set<T> {
    return new Set([...a, ...b]);
  }
  function equal<T>(a: Set<T>, b: Set<T>): boolean {
    return difference(a, b).size === 0;
  }
  const domSet: Map<Block, Set<Block>> = new Map();
  domSet.set(start, new Set([start]));
  for (const block of blocks) {
    if (block !== start) {
      domSet.set(block, new Set([...blocks]));
    }
  }
  let changes = true;
  while (changes) {
    changes = false;
    for (const block of blocks) {
      if (block === start) {
        continue;
      }
      const s = new Set<Block>([block]);
      let others = new Set<Block>();
      const pr = [...(preds.get(block) || new Set())];
      if (pr.length > 0) {
        others = domSet.get(pr[0]) || new Set();
        for (let i = 1; i < pr.length; i++) {
          const pred = pr[i];
          const dom = domSet.get(pred) || new Set();
          others = intersection(others, dom);
        }
      }
      const old = domSet.get(block) || new Set();

      const n = union(s, others);
      if (!equal(old, n)) {
        changes = true;
      }
      domSet.set(block, n);
    }
  }
  return {
    blocks,
    aToB: domSet,
    bToA: domSet,
  };
}
