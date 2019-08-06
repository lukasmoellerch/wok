declare const WebAssembly: any;
export default async function main() {

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
