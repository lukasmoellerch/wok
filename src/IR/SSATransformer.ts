import { Block, BlockType, IBasicBlock, ICompilationUnit, IInternalFunctionDeclaration, IInternalFunctionDefinition, InstructionType, SSAStatement, Type } from "./AST";
import { getWrittenVariables, isBreakStatement } from "./Utils";
export class TransformationEnvironment {
  public ssaTypes: Type[] = [];
  public variableTypes: Type[] = [];
  public variableSSAMapping: Map<number, number[]> = new Map();
  public SSAVariableMapping: Map<number, number> = new Map();
  public blockPhiMapping: Map<Block, Map<number, number[]>> = new Map();
  public blockStack: Block[] = [];
  public variableAssignments: Map<Block, Map<number, number>> = new Map();
  public ssaCounter: number = 0;
  public currentAssignment: Map<number, number> = new Map();
  constructor() {
    return;
  }
  public addMapping(variable: number, ssa: number) {
    const array = this.variableSSAMapping.get(ssa);
    if (array !== undefined) {
      array.push(ssa);
    } else {
      this.variableSSAMapping.set(variable, [ssa]);
    }
    this.ssaTypes[ssa] = this.variableTypes[variable];
    if (this.SSAVariableMapping.get(ssa) !== undefined) {
      throw new Error();
    }
    this.SSAVariableMapping.set(ssa, variable);
    this.ssaCounter = ssa + 1;
  }
  public ssa(variable: number): number {
    const block = this.blockStack[this.blockStack.length - 1];
    let blockMapping = this.variableAssignments.get(block);
    if (blockMapping === undefined) {
      const map = new Map();
      this.variableAssignments.set(block, map);
      blockMapping = map;
    }
    const ssa = this.ssaCounter;
    blockMapping.set(variable, ssa);
    this.addMapping(variable, ssa);
    return ssa;
  }
  public ssaOf(variable: number): number {
    const ssa = this.currentAssignment.get(variable);
    if (ssa === undefined) {
      throw new Error();
    }
    return ssa;
  }
  public getVariableAssignment(block: Block): Map<number, number> {
    let blockMapping = this.variableAssignments.get(block);
    if (blockMapping === undefined) {
      const map = new Map();
      this.variableAssignments.set(block, map);
      blockMapping = map;
    }
    return blockMapping;
  }
  public getPhiMapping(block: Block): Map<number, number[]> {
    let blockMapping = this.blockPhiMapping.get(block);
    if (blockMapping === undefined) {
      const map = new Map();
      this.blockPhiMapping.set(block, map);
      blockMapping = map;
    }
    return blockMapping;
  }
}
export class SSATransformer {
  public transformCompilationUnit(compilationUnit: ICompilationUnit): ICompilationUnit {
    const identifierDeclarationMap: Map<string, IInternalFunctionDeclaration> = new Map();
    for (const declaration of compilationUnit.internalFunctionDeclarations) {
      identifierDeclarationMap.set(declaration.identifier, declaration);
    }
    const code: IInternalFunctionDefinition[] = [];
    for (const definition of compilationUnit.functionCode) {
      const declaration = identifierDeclarationMap.get(definition.identifier);
      if (declaration === undefined) {
        continue;
      }
      const transformed = this.transformFunctionCode(declaration, definition);
      code.push(transformed);
    }
    return {
      mutableGlobals: compilationUnit.mutableGlobals,
      dataSegments: compilationUnit.dataSegments,
      externalFunctionDeclarations: compilationUnit.externalFunctionDeclarations,
      internalFunctionDeclarations: compilationUnit.internalFunctionDeclarations,
      functionCode: code,
    };
  }
  public transformFunctionCode(declaration: IInternalFunctionDeclaration, functionCode: IInternalFunctionDefinition): IInternalFunctionDefinition {
    const functionType = declaration.type;
    const argTypes = functionType[0];
    const env = new TransformationEnvironment();
    env.variableTypes = [...argTypes, ...functionCode.variableTypes];
    let j = 0;
    while (j < argTypes.length) {
      const argType = argTypes[j];
      env.variableTypes.push(argType);
      env.addMapping(j, env.ssaCounter);
      j++;
    }
    const blockArray = functionCode.code;
    const previousAssignment: Map<number, number> = new Map();
    const newBlockArray = this.traverseBlockArrayWrite(env, blockArray, undefined, undefined, previousAssignment);
    let i = 0;
    for (const argType of argTypes) {
      env.currentAssignment.set(i, i);
      i++;
    }
    const newCode = this.traverseBlockArrayRead(env, blockArray);
    const varTypes = env.ssaTypes.slice(argTypes.length);
    return {
      identifier: declaration.identifier,
      variableTypes: varTypes,
      code: newCode,
    };
  }
  public traverseBlockArrayRead(env: TransformationEnvironment, blockArray: Block[]): Block[] {
    const arr: Block[] = [];
    for (const block of blockArray) {
      const blocks = this.traverseBlockRead(env, block);
      arr.push(...blocks);
    }
    return arr;
  }
  public traverseBlockArrayWrite(env: TransformationEnvironment, blockArray: Block[], lastBlockReturnsTo: Block | undefined, breaksTo: Block | undefined, previousAssignment: Map<number, number>): Block[] {
    const array: Block[] = [];
    let i = 1;
    let prev = previousAssignment;
    for (const block of blockArray) {
      const returnBlock = blockArray.length > i ? blockArray[i] : lastBlockReturnsTo;
      const newBlock = this.traverseBlockWrite(env, block, returnBlock, breaksTo, prev);
      prev = env.getVariableAssignment(newBlock);
      array.push(newBlock);
      i++;
    }
    return array;
  }
  public traverseBlockRead(env: TransformationEnvironment, block: Block): Block[] {
    const phi = env.getPhiMapping(block);
    const variableAssignment = new Map();
    const phiStatements: SSAStatement[] = [];
    for (const [variable, ssa] of env.currentAssignment.entries()) {
      const phiArray = phi.get(variable);
      if (phiArray === undefined) {
        phi.set(variable, [ssa]);
      } else {
        phiArray.push(ssa);
      }
    }
    for (const [variable, ssaArr] of phi) {
      const arr = [...new Set(ssaArr).values()];
      if (arr.length === 1) {
        variableAssignment.set(variable, arr[0]);
      } else if (arr.length > 1) {
        const newSSA = env.ssa(variable);
        phiStatements.push([InstructionType.phi, newSSA, ssaArr]);
        env.currentAssignment.set(variable, newSSA);
      }
    }
    const phiBlock: IBasicBlock = {
      type: BlockType.basic,
      statements: phiStatements,
    };

    if (block.type === BlockType.basic) {
      for (const statement of block.statements) {
        const newStatement = this.traverseStatementRead(env, statement);
        if (newStatement === undefined) {
          continue;
        }
        phiStatements.push(newStatement);
      }
      block.statements = phiStatements;
      return [block];
    } else if (block.type === BlockType.breakable) {
      this.traverseBlockArrayRead(env, block.blocks);
      return [phiBlock, block];
    } else if (block.type === BlockType.if) {
      block.condition = env.ssaOf(block.condition);
      this.traverseBlockArrayRead(env, block.blocks);
      return [phiBlock, block];
    } else if (block.type === BlockType.ifelse) {
      block.condition = env.ssaOf(block.condition);
      this.traverseBlockArrayRead(env, block.true);
      this.traverseBlockArrayRead(env, block.false);
      return [phiBlock, block];
    } else if (block.type === BlockType.loop) {
      this.traverseBlockArrayRead(env, block.blocks);
      return [phiBlock, block];
    }
    return [];
  }
  public traverseBlockWrite(env: TransformationEnvironment, block: Block, returnsToBlock: Block | undefined, breaksTo: Block | undefined, previousAssignemnt: Map<number, number>): Block {
    env.blockStack.push(block);
    if (block.type === BlockType.basic) {
      const statements: SSAStatement[] = [];
      for (const statement of block.statements) {
        const newStatement = this.traverseStatementWrite(env, statement);
        if (newStatement === undefined) {
          continue;
        }
        statements.push(newStatement);
      }
      block.statements = statements;
      if (returnsToBlock !== undefined) {
        const assignment = env.getVariableAssignment(block);
        const phiNodeMapping = env.getPhiMapping(returnsToBlock);
        for (const [v, ssa] of assignment.entries()) {
          const arr = phiNodeMapping.get(v);
          if (arr === undefined) {
            phiNodeMapping.set(v, [ssa]);
          } else {
            arr.push(ssa);
          }
        }
      }
      if (breaksTo !== undefined && statements.findIndex(isBreakStatement) !== -1) {
        const assignment = env.getVariableAssignment(block);
        const phiNodeMapping = env.getPhiMapping(breaksTo);
        for (const [v, ssa] of assignment.entries()) {
          const arr = phiNodeMapping.get(v);
          if (arr === undefined) {
            phiNodeMapping.set(v, [ssa]);
          } else {
            arr.push(ssa);
          }
        }
      }
      return block;
    } else if (block.type === BlockType.breakable) {
      block.blocks = this.traverseBlockArrayWrite(env, block.blocks, returnsToBlock, returnsToBlock, previousAssignemnt);
      return block;
    } else if (block.type === BlockType.if) {
      block.blocks = this.traverseBlockArrayWrite(env, block.blocks, returnsToBlock, returnsToBlock, previousAssignemnt);
      if (returnsToBlock !== undefined) {
        const assignment = previousAssignemnt;
        const phiNodeMapping = env.getPhiMapping(returnsToBlock);
        for (const [v, ssa] of assignment.entries()) {
          const arr = phiNodeMapping.get(v);
          if (arr === undefined) {
            phiNodeMapping.set(v, [ssa]);
          } else {
            arr.push(ssa);
          }
        }
      }
      return block;
    } else if (block.type === BlockType.ifelse) {
      block.true = this.traverseBlockArrayWrite(env, block.true, returnsToBlock, returnsToBlock, previousAssignemnt);
      block.false = this.traverseBlockArrayWrite(env, block.false, returnsToBlock, returnsToBlock, previousAssignemnt);
      return block;
    } else if (block.type === BlockType.loop) {
      block.blocks = this.traverseBlockArrayWrite(env, block.blocks, returnsToBlock, block.blocks[0], previousAssignemnt);
      return block;
    }
    env.blockStack.pop();
    throw new Error("Invalid block");
  }
  public traverseStatementRead(env: TransformationEnvironment, statement: SSAStatement): SSAStatement | undefined {
    let newStatement: SSAStatement | undefined;
    if (statement[0] === InstructionType.phi) {
      newStatement = [statement[0], statement[1], statement[2].map((a) => env.ssaOf(a))];
    }
    if (statement[0] === InstructionType.break) {
      newStatement = [statement[0]];
    }
    if (statement[0] === InstructionType.breakIf) {
      newStatement = [statement[0], env.ssaOf(statement[1])];
    }
    if (statement[0] === InstructionType.breakIfFalse) {
      newStatement = [statement[0], env.ssaOf(statement[1])];
    }
    if (statement[0] === InstructionType.call) {
      newStatement = [statement[0], statement[1], statement[2], statement[3].map((a) => env.ssaOf(a))];
    }
    if (statement[0] === InstructionType.callFunctionPointer) {
      newStatement = [statement[0], statement[1], env.ssaOf(statement[2]), statement[3], statement[4].map((a) => env.ssaOf(a))];
    }
    if (statement[0] === InstructionType.setToConstant) {
      newStatement = [statement[0], statement[1], statement[2]];
    }
    if (statement[0] === InstructionType.setToFunction) {
      newStatement = [statement[0], statement[1], statement[2]];
    }
    if (statement[0] === InstructionType.setToGlobal) {
      newStatement = [statement[0], statement[1], statement[2]];
    }
    if (statement[0] === InstructionType.setToDataSegment) {
      newStatement = [statement[0], statement[1], statement[2]];
    }
    if (statement[0] === InstructionType.copy) {
      newStatement = [statement[0], statement[1], env.ssaOf(statement[2])];
    }
    if (statement[0] === InstructionType.load) {
      newStatement = [statement[0], statement[1], env.ssaOf(statement[2]), env.ssaOf(statement[3])];
    }
    if (statement[0] === InstructionType.store) {
      newStatement = [statement[0], env.ssaOf(statement[1]), env.ssaOf(statement[2]), env.ssaOf(statement[3])];
    }
    if (statement[0] === InstructionType.convert) {
      newStatement = [statement[0], statement[1], env.ssaOf(statement[2]), statement[3]];
    }
    if (statement[0] === InstructionType.equalToZero) {
      newStatement = [statement[0], statement[1], env.ssaOf(statement[2])];
    }
    if (statement[0] === InstructionType.equal) {
      newStatement = [statement[0], statement[1], env.ssaOf(statement[2]), env.ssaOf(statement[3])];
    }
    if (statement[0] === InstructionType.notEqual) {
      newStatement = [statement[0], statement[1], env.ssaOf(statement[2]), env.ssaOf(statement[3])];
    }
    if (statement[0] === InstructionType.less) {
      newStatement = [statement[0], statement[1], env.ssaOf(statement[2]), env.ssaOf(statement[3])];
    }
    if (statement[0] === InstructionType.greater) {
      newStatement = [statement[0], statement[1], env.ssaOf(statement[2]), env.ssaOf(statement[3])];
    }
    if (statement[0] === InstructionType.lessEqual) {
      newStatement = [statement[0], statement[1], env.ssaOf(statement[2]), env.ssaOf(statement[3])];
    }
    if (statement[0] === InstructionType.greaterEqual) {
      newStatement = [statement[0], statement[1], env.ssaOf(statement[2]), env.ssaOf(statement[3])];
    }
    if (statement[0] === InstructionType.countLeadingZeroes) {
      newStatement = [statement[0], statement[1], env.ssaOf(statement[2])];
    }
    if (statement[0] === InstructionType.countTrailingZeroes) {
      newStatement = [statement[0], statement[1], env.ssaOf(statement[2])];
    }
    if (statement[0] === InstructionType.add) {
      newStatement = [statement[0], statement[1], env.ssaOf(statement[2]), env.ssaOf(statement[3])];
    }
    if (statement[0] === InstructionType.subtract) {
      newStatement = [statement[0], statement[1], env.ssaOf(statement[2]), env.ssaOf(statement[3])];
    }
    if (statement[0] === InstructionType.multiply) {
      newStatement = [statement[0], statement[1], env.ssaOf(statement[2]), env.ssaOf(statement[3])];
    }
    if (statement[0] === InstructionType.divide) {
      newStatement = [statement[0], statement[1], env.ssaOf(statement[2]), env.ssaOf(statement[3])];
    }
    if (statement[0] === InstructionType.remainder) {
      newStatement = [statement[0], statement[1], env.ssaOf(statement[2]), env.ssaOf(statement[3])];
    }
    if (statement[0] === InstructionType.and) {
      newStatement = [statement[0], statement[1], env.ssaOf(statement[2]), env.ssaOf(statement[3])];
    }
    if (statement[0] === InstructionType.or) {
      newStatement = [statement[0], statement[1], env.ssaOf(statement[2]), env.ssaOf(statement[3])];
    }
    if (statement[0] === InstructionType.xor) {
      newStatement = [statement[0], statement[1], env.ssaOf(statement[2]), env.ssaOf(statement[3])];
    }
    if (statement[0] === InstructionType.shiftLeft) {
      newStatement = [statement[0], statement[1], env.ssaOf(statement[2]), env.ssaOf(statement[3])];
    }
    if (statement[0] === InstructionType.shiftRight) {
      newStatement = [statement[0], statement[1], env.ssaOf(statement[2]), env.ssaOf(statement[3])];
    }
    if (statement[0] === InstructionType.rotateleft) {
      newStatement = [statement[0], statement[1], env.ssaOf(statement[2]), env.ssaOf(statement[3])];
    }
    if (statement[0] === InstructionType.rotateRight) {
      newStatement = [statement[0], statement[1], env.ssaOf(statement[2]), env.ssaOf(statement[3])];
    }
    if (statement[0] === InstructionType.absolute) {
      newStatement = [statement[0], statement[1], env.ssaOf(statement[2])];
    }
    if (statement[0] === InstructionType.negate) {
      newStatement = [statement[0], statement[1], env.ssaOf(statement[2])];
    }
    if (statement[0] === InstructionType.floor) {
      newStatement = [statement[0], statement[1], env.ssaOf(statement[2])];
    }
    if (statement[0] === InstructionType.truncate) {
      newStatement = [statement[0], statement[1], env.ssaOf(statement[2])];
    }
    if (statement[0] === InstructionType.nearest) {
      newStatement = [statement[0], statement[1], env.ssaOf(statement[2])];
    }
    if (statement[0] === InstructionType.sqrt) {
      newStatement = [statement[0], statement[1], env.ssaOf(statement[2])];
    }
    if (statement[0] === InstructionType.minimum) {
      newStatement = [statement[0], statement[1], env.ssaOf(statement[2]), env.ssaOf(statement[3])];
    }
    if (statement[0] === InstructionType.maximum) {
      newStatement = [statement[0], statement[1], env.ssaOf(statement[2]), env.ssaOf(statement[3])];
    }
    if (statement[0] === InstructionType.return) {
      newStatement = [statement[0], statement[1].map((a) => env.ssaOf(a))];
    }
    const writes = getWrittenVariables(statement);
    for (const write of writes) {
      const variable = env.SSAVariableMapping.get(write);
      if (variable === undefined) {
        continue;
      }
      env.currentAssignment.set(variable, write);
    }
    return newStatement;
  }
  public traverseStatementWrite(env: TransformationEnvironment, statement: SSAStatement): SSAStatement | undefined {
    if (statement[0] === InstructionType.phi) {
      return [statement[0], env.ssa(statement[1]), statement[2]];
    }
    if (statement[0] === InstructionType.break) {
      return [statement[0]];
    }
    if (statement[0] === InstructionType.breakIf) {
      return [statement[0], statement[1]];
    }
    if (statement[0] === InstructionType.breakIfFalse) {
      return [statement[0], statement[1]];
    }
    if (statement[0] === InstructionType.call) {
      return [statement[0], statement[1], statement[2].map((a) => env.ssa(a)), statement[3]];
    }
    if (statement[0] === InstructionType.callFunctionPointer) {
      return [statement[0], statement[1], statement[2], statement[3].map((a) => env.ssa(a)), statement[4]];
    }
    if (statement[0] === InstructionType.setToConstant) {
      return [statement[0], env.ssa(statement[1]), statement[2]];
    }
    if (statement[0] === InstructionType.setToFunction) {
      return [statement[0], env.ssa(statement[1]), statement[2]];
    }
    if (statement[0] === InstructionType.setToGlobal) {
      return [statement[0], env.ssa(statement[1]), statement[2]];
    }
    if (statement[0] === InstructionType.setToDataSegment) {
      return [statement[0], env.ssa(statement[1]), statement[2]];
    }
    if (statement[0] === InstructionType.copy) {
      return [statement[0], env.ssa(statement[1]), statement[2]];
    }
    if (statement[0] === InstructionType.load) {
      return [statement[0], env.ssa(statement[1]), statement[2], statement[3]];
    }
    if (statement[0] === InstructionType.store) {
      return [statement[0], statement[1], statement[2], statement[3]];
    }
    if (statement[0] === InstructionType.convert) {
      return [statement[0], env.ssa(statement[1]), statement[2], statement[3]];
    }
    if (statement[0] === InstructionType.equalToZero) {
      return [statement[0], env.ssa(statement[1]), statement[2]];
    }
    if (statement[0] === InstructionType.equal) {
      return [statement[0], env.ssa(statement[1]), statement[2], statement[3]];
    }
    if (statement[0] === InstructionType.notEqual) {
      return [statement[0], env.ssa(statement[1]), statement[2], statement[3]];
    }
    if (statement[0] === InstructionType.less) {
      return [statement[0], env.ssa(statement[1]), statement[2], statement[3]];
    }
    if (statement[0] === InstructionType.greater) {
      return [statement[0], env.ssa(statement[1]), statement[2], statement[3]];
    }
    if (statement[0] === InstructionType.lessEqual) {
      return [statement[0], env.ssa(statement[1]), statement[2], statement[3]];
    }
    if (statement[0] === InstructionType.greaterEqual) {
      return [statement[0], env.ssa(statement[1]), statement[2], statement[3]];
    }
    if (statement[0] === InstructionType.countLeadingZeroes) {
      return [statement[0], env.ssa(statement[1]), statement[2]];
    }
    if (statement[0] === InstructionType.countTrailingZeroes) {
      return [statement[0], env.ssa(statement[1]), statement[2]];
    }
    if (statement[0] === InstructionType.add) {
      return [statement[0], env.ssa(statement[1]), statement[2], statement[3]];
    }
    if (statement[0] === InstructionType.subtract) {
      return [statement[0], env.ssa(statement[1]), statement[2], statement[3]];
    }
    if (statement[0] === InstructionType.multiply) {
      return [statement[0], env.ssa(statement[1]), statement[2], statement[3]];
    }
    if (statement[0] === InstructionType.divide) {
      return [statement[0], env.ssa(statement[1]), statement[2], statement[3]];
    }
    if (statement[0] === InstructionType.remainder) {
      return [statement[0], env.ssa(statement[1]), statement[2], statement[3]];
    }
    if (statement[0] === InstructionType.and) {
      return [statement[0], env.ssa(statement[1]), statement[2], statement[3]];
    }
    if (statement[0] === InstructionType.or) {
      return [statement[0], env.ssa(statement[1]), statement[2], statement[3]];
    }
    if (statement[0] === InstructionType.xor) {
      return [statement[0], env.ssa(statement[1]), statement[2], statement[3]];
    }
    if (statement[0] === InstructionType.shiftLeft) {
      return [statement[0], env.ssa(statement[1]), statement[2], statement[3]];
    }
    if (statement[0] === InstructionType.shiftRight) {
      return [statement[0], env.ssa(statement[1]), statement[2], statement[3]];
    }
    if (statement[0] === InstructionType.rotateleft) {
      return [statement[0], env.ssa(statement[1]), statement[2], statement[3]];
    }
    if (statement[0] === InstructionType.rotateRight) {
      return [statement[0], env.ssa(statement[1]), statement[2], statement[3]];
    }
    if (statement[0] === InstructionType.absolute) {
      return [statement[0], env.ssa(statement[1]), statement[2]];
    }
    if (statement[0] === InstructionType.negate) {
      return [statement[0], env.ssa(statement[1]), statement[2]];
    }
    if (statement[0] === InstructionType.floor) {
      return [statement[0], env.ssa(statement[1]), statement[2]];
    }
    if (statement[0] === InstructionType.truncate) {
      return [statement[0], env.ssa(statement[1]), statement[2]];
    }
    if (statement[0] === InstructionType.nearest) {
      return [statement[0], env.ssa(statement[1]), statement[2]];
    }
    if (statement[0] === InstructionType.sqrt) {
      return [statement[0], env.ssa(statement[1]), statement[2]];
    }
    if (statement[0] === InstructionType.minimum) {
      return [statement[0], env.ssa(statement[1]), statement[2], statement[3]];
    }
    if (statement[0] === InstructionType.maximum) {
      return [statement[0], env.ssa(statement[1]), statement[2], statement[3]];
    }
    if (statement[0] === InstructionType.return) {
      return [statement[0], statement[1]];
    }
    throw new Error();
  }
}
