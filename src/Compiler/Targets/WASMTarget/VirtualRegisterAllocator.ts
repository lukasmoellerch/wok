import { FunctionIdentifier, FunctionType, ICompilationUnit, InstructionType, Variable } from "../../IR/AST";
import { getReadVariables, getStatementsInLinearOrder, getWrittenVariables, mapIRTypeToWasm } from "./Utils";
import { ValueType } from "./WASM/Encoding/Constants";
export interface IBucket {
  variables: Variable[];
  usage: Array<[number, number]>;
  total: [number, number];
  index: number;
}
export type UsageSpanMapping = Map<ValueType, IBucket[]>;
export interface IVirtualRegisterAllocationResult {
  usageSpanMappings: Map<FunctionIdentifier, UsageSpanMapping>;
}
export function allocateVirtualRegistersToVariables(ir: ICompilationUnit): IVirtualRegisterAllocationResult {
  const usageSpanMappings: Map<FunctionIdentifier, UsageSpanMapping> = new Map();
  const functionIdentifierTypeMapping: Map<string, FunctionType> = new Map();
  for (const internalFunctionDeclaration of ir.internalFunctionDeclarations) {
    functionIdentifierTypeMapping.set(internalFunctionDeclaration.identifier, internalFunctionDeclaration.type);
  }
  for (const fn of ir.functionCode) {
    const identifier = fn.identifier;
    const functionType = functionIdentifierTypeMapping.get(identifier);
    if (functionType === undefined) {
      continue;
    }
    const localTypes = fn.variableTypes;
    const variableTypeArray = functionType[0].concat(localTypes);

    const buckets: Variable[][] = [];
    const statements = getStatementsInLinearOrder(fn.code);
    const phiNodes: Array<[Variable, Variable[]]> = [];

    const firstUsed: Map<Variable, number> = new Map();
    const lastUsed: Map<Variable, number> = new Map();

    for (const [argumentIndex] of functionType[0].entries()) {
      buckets.push([argumentIndex]);
      firstUsed.set(argumentIndex, -1);
    }
    let i = 0;
    for (const statement of statements) {
      if (statement[0] === InstructionType.phi) {
        phiNodes.push([statement[1], statement[2]]);
      }
      const writtenVariables = getWrittenVariables(statement);
      for (const variable of writtenVariables) {
        buckets.push([variable]);
        if (firstUsed.get(variable) !== undefined) {
          throw new Error("not SSA");
        }
        firstUsed.set(variable, i);
      }
      const readVariables = getReadVariables(statement);
      for (const variable of readVariables) {
        lastUsed.set(variable, i);
      }
      i++;
    }
    for (const phiNode of phiNodes) {
      const phiNodeOperands: Variable[] = phiNode[1];
      phiNodeOperands.push(phiNode[0]);
      let newBucketContents: Variable[] = [];
      let j = 0;
      for (const bucket of buckets) {
        let containsPhiNodeOperand = false;
        for (const bucketContent of bucket) {
          if (phiNodeOperands.indexOf(bucketContent) !== -1) {
            containsPhiNodeOperand = true;
            break;
          }
        }
        if (containsPhiNodeOperand) {
          newBucketContents = newBucketContents.concat(bucket);
          buckets.splice(j, 1);
        }
        j++;
      }
      buckets.push(newBucketContents);
    }

    const usageSpanMapping: Map<ValueType, IBucket[]> = new Map();
    let bucketIndex = 0;
    for (const bucket of buckets) {
      const first = bucket[0];
      const type = mapIRTypeToWasm(ir, variableTypeArray[first]);
      let bucketsWithSameType: IBucket[] = [];
      const savedValue = usageSpanMapping.get(type);
      if (savedValue) {
        bucketsWithSameType = savedValue;
      } else {
        usageSpanMapping.set(type, bucketsWithSameType);
      }
      const usage: Array<[number, number]> = [];
      for (const variable of bucket) {
        const a = firstUsed.get(variable);
        const b = lastUsed.get(variable);
        if (a === undefined) {
          continue;
        }
        if (b === undefined) {
          continue;
        }
        usage.push([
          Math.min(a, b),
          Math.max(a, b),
        ]);
      }
      const obj = {
        variables: bucket,
        usage,
        total: [
          Math.min(...usage.map((a) => a[0])),
          Math.max(...usage.map((a) => a[1])),
        ],
        index: bucketIndex,
      } as IBucket;
      bucketsWithSameType.push(obj);
      bucketIndex++;
    }
    usageSpanMappings.set(fn.identifier, usageSpanMapping);
  }
  return { usageSpanMappings };
}
