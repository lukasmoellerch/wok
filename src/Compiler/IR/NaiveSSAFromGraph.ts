import { mapReadVariables, mapWrittenVariables } from "../Targets/WASMTarget/Utils";
import { Block, BlockType, IBasicBlock, IInternalFunctionDeclaration, IInternalFunctionDefinition, InstructionType, SSAStatement, Type } from "./AST";
import { IGraph } from "./GraphAnalyzer";
function defaultGet<K, V>(map: Map<K, V>, key: K, def: V): V {
  const q = map.get(key);
  if (q !== undefined) {
    return q;
  }
  map.set(key, def);
  return def;
}
function defaultGetFunction<K, V>(map: Map<K, V>, key: K, def: () => V): V {
  const q = map.get(key);
  if (q !== undefined) {
    return q;
  }
  const m = def();
  map.set(key, m);
  return m;
}
export function transformToSSA(functionDeclaration: IInternalFunctionDeclaration, definition: IInternalFunctionDefinition, graph: IGraph, start: Block) {
  const varTypes: Type[] = [];
  const ssaTypes: Type[] = [];
  let i = 0;
  for (const arg of functionDeclaration.type[0]) {
    i++;
    varTypes.push(arg);
    ssaTypes.push(arg);
  }
  varTypes.push(...definition.variableTypes);
  const blockPhiNodeMap: Map<Block, Map<number, Set<number>>> = new Map();
  const blockDefinesVariables: Map<Block, Map<number, number>> = new Map();
  const phiNodeSSA: Map<Block, Map<number, number>> = new Map();
  const definedVariablesOfBlock: Map<Block, Set<number>> = new Map();
  const Q: Block[] = [];
  const discovered: Set<Block> = new Set();
  discovered.add(start);
  Q.push(start);
  while (Q.length > 0) {
    const v = Q.shift();
    if (v === undefined) {
      break;
    }
    const childs = graph.aToB.get(v) || new Set();
    const definedVariables: Set<number> = new Set();
    const k = defaultGet(phiNodeSSA, v, new Map<number, number>());
    const t = defaultGet(blockDefinesVariables, v, new Map<number, number>());
    let u = 0;
    for (const arg of functionDeclaration.type[0]) {
      t.set(u, u);
      k.set(u, u);
      u++;
    }
    if (v.type === BlockType.basic) {
      for (let r = 0; r < v.statements.length; r++) {
        const statement = v.statements[r];
        v.statements[r] = mapWrittenVariables(statement, (ir) => {
          t.set(i, ir);
          k.set(ir, i);
          const ssa = i;
          definedVariables.add(ssa);
          i++;
          ssaTypes.push(varTypes[ir]);
          return ssa;
        });
      }
    }
    definedVariablesOfBlock.set(v, definedVariables);
    const Q2: Block[] = [...childs];
    const marked2: Set<Block> = new Set([...childs]);
    while (Q2.length > 0) {
      const child = Q2.shift();
      if (child === undefined) {
        continue;
      }
      const l = defaultGet(blockDefinesVariables, child, new Map<number, number>());
      for (const [a, b] of t) {
        l.set(a, b);
      }
      const map = defaultGet(blockPhiNodeMap, child, new Map<number, Set<number>>());
      for (const [name, written] of t) {
        const h = defaultGet(map, written, new Set<number>());
        h.add(name);
      }
      for (const c of (graph.aToB.get(child) || new Set())) {
        if (!marked2.has(c)) {
          marked2.add(c);
          Q2.push(c);
        }
      }
    }
    for (const child of childs) {
      if (!discovered.has(child)) {
        discovered.add(child);
        Q.push(child);
      }
    }
  }
  for (const block of graph.blocks) {
    const phiMap = defaultGet(blockPhiNodeMap, block, new Map<number, Set<number>>());
    const phiStatements: SSAStatement[] = [];
    const ssaVarsForPhiNodes = defaultGet(phiNodeSSA, block, new Map<number, number>());
    const variableSSAMapping: Map<number, number> = new Map();
    const definedVars = defaultGet(definedVariablesOfBlock, block, new Set<number>());
    let u = 0;
    for (const arg of functionDeclaration.type[0]) {
      variableSSAMapping.set(u, u);
      u++;
    }
    const t = defaultGet(blockDefinesVariables, block, new Map<number, number>());
    for (const [a, n] of phiMap) {
      if (n.size > 1) {
        let ssa = defaultGetFunction(ssaVarsForPhiNodes, a, () => {
          const g = i;
          i++;
          ssaTypes.push(varTypes[[...n][0]]);
          return g;
        });
        if (definedVars.has(ssa)) {
          ssa = i++;
          ssaTypes.push(varTypes[[...n][0]]);
          variableSSAMapping.set(a, ssa);
          ssaVarsForPhiNodes.set(a, ssa);
          phiStatements.push([InstructionType.phi, ssa, [...n]]);
        } else {
          variableSSAMapping.set(a, ssa);
          ssaVarsForPhiNodes.set(a, ssa);
          phiStatements.push([InstructionType.phi, ssa, [...n]]);
        }

      } else {
        variableSSAMapping.set(a, [...n][0]);
        t.set([...n][0], a);
      }
    }
    const transform = (ir: number) => {
      const q = variableSSAMapping.get(ir);
      if (q === undefined) {
        return -1;
      }
      return q;
    };
    const h: IBasicBlock = { type: BlockType.basic, statements: phiStatements };
    const h2: IBasicBlock = { type: BlockType.basic, statements: [...phiStatements] };
    if (block.type === BlockType.basic) {
      for (let r = 0; r < block.statements.length; r++) {
        block.statements[r] = mapReadVariables(block.statements[r], transform);
        mapWrittenVariables(block.statements[r], (ssa) => {
          const ir = t.get(ssa);
          if (ir === undefined) {
            console.log("E");
            return ssa;
          }
          variableSSAMapping.set(ir, ssa);
          return ssa;
        });
      }
      block.statements = [...phiStatements, ...block.statements];
    } else if (block.type === BlockType.breakable) {
      if (h.statements.length > 0) {
        block.blocks = [h, ...block.blocks];
      }
    } else if (block.type === BlockType.if) {
      block.condition = transform(block.condition);
      if (h.statements.length > 0) {
        block.blocks = [h, ...block.blocks];
      }
    } else if (block.type === BlockType.ifelse) {
      block.condition = transform(block.condition);
      if (h.statements.length > 0) {
        block.true = [h, ...block.true];
        block.false = [h2, ...block.false];
      }
    } else if (block.type === BlockType.loop) {
      if (h.statements.length > 0) {
        block.blocks = [h, ...block.blocks];
      }
    }
  }
  definition.variableTypes = ssaTypes;;
}
