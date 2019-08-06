import { writeFile } from "fs";
import { promisify } from "util";
import { BlockType, ICompilationUnit, InstructionType, Type } from "./IR/AST";
import { compileIR } from "./IR/IRCompiler";
import { encodeModule } from "./WASM/Encoding/Encoder";
import { TypedArrayBytestreamConsumer } from "./WASM/Encoding/TypedArrayBytestreamConsumer";
declare const WebAssembly: any;
export default async function main() {
  const ir: ICompilationUnit = {
    globalMutableGlobals: [],
    externalFunctionDeclarations: [
      {
        identifier: "printInteger",
        type: [[Type.si32], []],
        externalName: "printInteger",
      },
    ],
    internalFunctionDeclarations: [
      {
        identifier: "main",
        type: [[Type.si32], []],
        inlinable: true,
        globalStateMutating: false,
        tableElement: false,
      },
    ],
    functionCode: [
      {
        identifier: "main",
        variableTypes: [/* arg, */Type.si32, Type.ui32, Type.si32, Type.si32, Type.si32, Type.ui32],
        code: [
          {
            type: BlockType.basic,
            statements: [
              [InstructionType.setToConstant, 1, 0],
            ],
          },
          {
            type: BlockType.breakble,
            blocks: [
              {
                type: BlockType.basic,
                statements: [
                  [InstructionType.less, 2, 1, 0],
                  [InstructionType.breakIfFalse, 2],
                ],
              },
              {
                type: BlockType.loop,
                blocks: [
                  {
                    type: BlockType.basic,
                    statements: [
                      [InstructionType.phi, 3, [1, 5]],
                      [InstructionType.call, "printInteger", [], [3]],
                      [InstructionType.setToConstant, 4, 2],
                      [InstructionType.add, 5, 4, 3],
                      [InstructionType.less, 6, 3, 0],
                      [InstructionType.breakIf, 6],
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
  const wsamModule = compileIR(ir);
  const consumer = new TypedArrayBytestreamConsumer();
  encodeModule(wsamModule, consumer);
  const encoded = consumer.cleanArray;
  if (process.argv.length > 2) {
    await promisify(writeFile)(process.argv[2], encoded);
  }
  const module = new WebAssembly.Module(encoded);
  const instance = new WebAssembly.Instance(module, {
    env: {
      printInteger(i: number) {
        console.log(i);
      },
    },
  });
  instance.exports.main(12);
  /*const builder = new ASTBuilder();
  const i32 = ValueType.i32;
  const mainFunction = new InstructionSequenceBuilder();
  mainFunction.localGet(0);
  mainFunction.localGet(1);
  mainFunction.numeric(Instruction.i32DivideUnsigned);
  mainFunction.consumer.write(Instruction.blockend);
  builder.addFunction("main", builder.functionTypeIndex([i32, i32], i32), [], mainFunction.instructions);
  console.log(builder.module);
  const module = new WebAssembly.Module(builder.encodedModule);
  const instance = new WebAssembly.Instance(module);
  console.log(instance.exports.main(12, 2));*/
}
