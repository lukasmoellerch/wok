import * as commandpost from "commandpost";
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
  .option("--apply", "replace files")
  .option("--no-output", "silent mode")
  .option("-c, --config <file>", "specified config file")
  .action((opts, args, rest) => {
    console.log("root action");
    console.log(opts);
    console.log(args);
    console.log(rest);
  });
