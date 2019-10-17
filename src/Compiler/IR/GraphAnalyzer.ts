import { isBreakStatement } from "../Targets/WASMTarget/Utils";
import { Block, BlockType, ICompilationUnit, IInternalFunctionDeclaration, IInternalFunctionDefinition } from "./AST";
export interface IGraph {
  blocks: Set<Block>;
  aToB: Map<Block, Set<Block>>;
  bToA: Map<Block, Set<Block>>;
}
export class TransformationEnvironment {
  public blockEntryMapping: Map<Block, Set<Block>> = new Map(); // Bs are entries to A
  public entriesToBlockMapping: Map<Block, Set<Block>> = new Map();
  public blocks: Set<Block> = new Set();
  constructor() {
    return;
  }
  public addBlockAsEntryOf(self: Block, other: Block) {
    const a = this.blockEntryMapping.get(other);
    if (a === undefined) {
      this.blockEntryMapping.set(other, new Set([self]));
    } else {
      a.add(self);
    }
    const q = this.entriesToBlockMapping.get(self);
    if (q === undefined) {
      this.entriesToBlockMapping.set(self, new Set([other]));
    } else {
      q.add(other);
    }
  }
}
export class GraphAnalyzer {
  public analyzeCompilationUnit(compilationUnit: ICompilationUnit): Map<string, IGraph> {
    const identifierDeclarationMapping: Map<string, IInternalFunctionDeclaration> = new Map();
    for (const internalFunctionDeclaration of compilationUnit.internalFunctionDeclarations) {
      identifierDeclarationMapping.set(internalFunctionDeclaration.identifier, internalFunctionDeclaration);
    }
    const map = new Map();
    for (const internalFunctionCode of compilationUnit.functionCode) {
      const declaration = identifierDeclarationMapping.get(internalFunctionCode.identifier);
      if (declaration === undefined) {
        throw new Error();
      }
      map.set(internalFunctionCode.identifier, this.calculateGraph(declaration, internalFunctionCode));
    }
    return map;
  }

  public calculateGraph(declaration: IInternalFunctionDeclaration, functionCode: IInternalFunctionDefinition): IGraph {
    const functionType = declaration.type;
    const argTypes = functionType[0];
    const env = new TransformationEnvironment();
    const blockArray = functionCode.code;
    this.arrayBuildEntryPointsAndSSAAssignments(env, blockArray, undefined, undefined);
    return {
      blocks: env.blocks,
      aToB: env.entriesToBlockMapping,
      bToA: env.blockEntryMapping,
    };
  }
  public arrayBuildEntryPointsAndSSAAssignments(env: TransformationEnvironment, blockArray: Block[], returnsTo: Block | undefined, breaksTo: Block | undefined) {
    for (let i = 0; i < blockArray.length; i++) {
      const returnBlock = i === blockArray.length - 1 ? returnsTo : blockArray[i + 1];
      this.buildEntryPointsAndSSAAssignments(env, blockArray[i], returnBlock, breaksTo);
    }
  }
  public buildEntryPointsAndSSAAssignments(env: TransformationEnvironment, block: Block, returnsTo: Block | undefined, breaksTo: Block | undefined) {
    env.blocks.add(block);
    if (block.type === BlockType.basic) {
      if (returnsTo !== undefined) {
        env.addBlockAsEntryOf(block, returnsTo);
      }
      let breaks = false;
      for (const statement of block.statements) {
        if (isBreakStatement(statement)) {
          breaks = true;
        }
      }
      if (breaks) {
        if (breaksTo !== undefined) {
          env.addBlockAsEntryOf(block, breaksTo);
        }
      }
    } else if (block.type === BlockType.breakable) {
      env.addBlockAsEntryOf(block, block.blocks[0]);
      this.arrayBuildEntryPointsAndSSAAssignments(env, block.blocks, returnsTo, returnsTo);
    } else if (block.type === BlockType.if) {
      if (returnsTo !== undefined) {
        env.addBlockAsEntryOf(block, returnsTo);
      }
      env.addBlockAsEntryOf(block, block.blocks[0]);
      this.arrayBuildEntryPointsAndSSAAssignments(env, block.blocks, returnsTo, breaksTo);
    } else if (block.type === BlockType.ifelse) {
      env.addBlockAsEntryOf(block, block.true[0]);
      this.arrayBuildEntryPointsAndSSAAssignments(env, block.true, returnsTo, breaksTo);
      env.addBlockAsEntryOf(block, block.false[0]);
      this.arrayBuildEntryPointsAndSSAAssignments(env, block.false, returnsTo, breaksTo);
    } else if (block.type === BlockType.loop) {
      env.addBlockAsEntryOf(block, block.blocks[0]);
      this.arrayBuildEntryPointsAndSSAAssignments(env, block.blocks, returnsTo, block.blocks[0]);
    }
  }
}
