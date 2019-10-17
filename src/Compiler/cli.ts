import * as commandpost from "commandpost";
import * as fs from "fs";
import { compile } from "..";
interface RootOptions {
  applyRemoveCopy: boolean;
  applyRemoveUnused: string[];
  target: string;
  pipeToStdout: string;
}
interface RootArgs {
}
const root = commandpost
  .create<RootOptions, RootArgs>("wok")
  .version("0.0.0", "-v, --version")
  .description("The compiler frontend for woklang.")
  .action(async (_opts, _args, _rest) => {
    console.log("starting compiler");
    const readFile = await fs.promises.readFile("./example/main.wok");
    compile(readFile.toString(), "ssa");
  });
if (process.argv.length === 2) {
  (async () => {
    console.log("starting compiler");
    const readFile = await fs.promises.readFile("./example/main.wok");
    console.log(compile(readFile.toString(), "java"));
  })();
} else {
  commandpost
    .exec(root, process.argv)
    .catch((err) => {
      if (err instanceof Error) {
        console.error(err.stack);
      } else {
        console.error(err);
      }
      process.exit(1);
    });

}
