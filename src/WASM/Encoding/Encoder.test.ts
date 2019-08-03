import { IFunctionType, ILocal, Section } from "../AST";
import {
  ExportDescription,
  Section as SectionId,
  Instruction,
  ValueType
} from "./Constants";
import { encodeModule } from "./Encoder";
import { TypedArrayBytestreamConsumer } from "./TypedArrayBytestreamConsumer";
import { InstructionSequenceBuilder } from "./InstructionSequenceBuilder";
declare const WebAssembly: any;
async function encodeInstructionSequenceAsMainExport(
  functionType: IFunctionType,
  locals: ILocal[],
  sequence: Uint8Array,
  additionalSections: Section[] = []
) {
  const consumer = new TypedArrayBytestreamConsumer();
  encodeModule(
    {
      sections: [
        {
          sectionId: SectionId.type,
          types: [functionType]
        },
        {
          sectionId: SectionId.function,
          functions: [0]
        },
        {
          sectionId: SectionId.export,
          exports: [
            {
              name: "main",
              description: { type: ExportDescription.function, index: 0 }
            }
          ]
        },
        {
          sectionId: SectionId.code,
          codeEntries: [
            {
              locals: locals,
              expression: sequence
            }
          ]
        },
        ...additionalSections
      ]
    },
    consumer
  );
  const buffer = consumer.cleanArray;
  const result = await WebAssembly.instantiate(buffer);
  return result.instance.exports;
}
test("Can encode a basic working add function", async () => {
  const builder = new InstructionSequenceBuilder();
  builder.localGet(0);
  builder.localGet(1);
  builder.numeric(Instruction.i32Add);
  builder.consumer.write(Instruction.blockend);
  const type: IFunctionType = {
    arguments: [ValueType.i32, ValueType.i32],
    results: [ValueType.i32]
  };
  const locals: ILocal[] = [];
  const exports = await encodeInstructionSequenceAsMainExport(
    type,
    locals,
    builder.instructions
  );
  expect(exports.main(12, 52)).toEqual(64);
  expect(exports.main(91235, 3251)).toEqual(94486);
  expect(exports.main(2325, 1256)).toEqual(3581);
});
test("Can encode a module with a custom section that still works correctly", async () => {
  const builder = new InstructionSequenceBuilder();
  builder.localGet(0);
  builder.localGet(1);
  builder.numeric(Instruction.i32Add);
  builder.consumer.write(Instruction.blockend);
  const type: IFunctionType = {
    arguments: [ValueType.i32, ValueType.i32],
    results: [ValueType.i32]
  };
  const locals: ILocal[] = [];
  const exports = await encodeInstructionSequenceAsMainExport(
    type,
    locals,
    builder.instructions,
    [
      {
        sectionId: SectionId.custom,
        name: "custom section :D",
        content: new Uint8Array([12, 53, 12, 53])
      }
    ]
  );
  expect(exports.main(12, 52)).toEqual(64);
  expect(exports.main(91235, 3251)).toEqual(94486);
  expect(exports.main(2325, 1256)).toEqual(3581);
});
