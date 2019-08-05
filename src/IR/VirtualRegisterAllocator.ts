import { FunctionType, ICompilationUnit, InstructionType, Variable } from "./AST";
import { getStatementsInLinearOrder, getWrittenVariables } from "./Utils";
export function allocateVirtualRegistersToVariables(ir: ICompilationUnit): void {
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
    // const localTypes = fn.variableTypes;
    // const variableTypeArray = functionType[0].concat(localTypes);

    const buckets: Variable[][] = [];
    const statements = getStatementsInLinearOrder(fn.code);
    const phiNodes: Array<[Variable, Variable[]]> = [];
    for (const statement of statements) {
      if (statement[0] === InstructionType.phi) {
        phiNodes.push([statement[1], statement[2]]);
      }
      const writtenVariables = getWrittenVariables(statement);
      for (const variable of writtenVariables) {
        buckets.push([variable]);
      }
    }
    for (const phiNode of phiNodes) {
      const phiNodeOperands: Variable[] = phiNode[1];
      phiNodeOperands.push(phiNode[0]);
      let newBucketContents: Variable[] = [];
      let i = 0;
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
          buckets.splice(i, 1);
        }
        i++;
      }
      buckets.push(newBucketContents);
    }
    const usageSpanMappingI32;
    console.log(buckets);
  }
}
