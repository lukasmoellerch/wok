import { encodeModule } from "../WASM/Encoding/Encoder";
import { TypedArrayBytestreamConsumer } from "../WASM/Encoding/TypedArrayBytestreamConsumer";
import { BlockType, ICompilationUnit, InstructionType, Type } from "./AST";
import { compileIR } from "./IRCompiler";
declare const WebAssembly: any;
test("Can compile a basic function that lists even integers up to the parameter", () => {
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
            type: BlockType.breakble,
            blocks: [
              {
                type: BlockType.basic,
                statements: [
                  [InstructionType.setToConstant, 1, 0],
                  [InstructionType.less, 2, 0, 1],
                  [InstructionType.breakIf, 2],
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
  let buffer = "";
  const wsamModule = compileIR(ir);
  const consumer = new TypedArrayBytestreamConsumer();
  encodeModule(wsamModule, consumer);
  const encoded = consumer.cleanArray;
  const module = new WebAssembly.Module(encoded);
  const instance = new WebAssembly.Instance(module, {
    env: {
      printInteger(i: number) {
        buffer += `${i}\n`;
      },
    },
  });
  instance.exports.main(12);
  expect(buffer).toEqual("0\n2\n4\n6\n8\n10\n");

  buffer = "";
  instance.exports.main(10);
  expect(buffer).toEqual("0\n2\n4\n6\n8\n");
});
