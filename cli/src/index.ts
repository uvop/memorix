#!/usr/bin/env node
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import { codegen } from "./codgen";
import { printLogo } from "./print-logo";

yargs(hideBin(process.argv))
  .command(
    "codegen <schemaFilePath>",
    `Codegen memorix schema to code

Example: memorix codegen ./schema.memorix`,
    (b) => {
      return b.positional("schemaFilePath", {
        describe: "Memorix schema file",
      });
    },
    (argv) => {
      const { schemaFilePath } = argv as {
        schemaFilePath: string;
      };
      printLogo();
      codegen({
        schemaFilePath,
      });
    }
  )
  .option("verbose", {
    alias: "v",
    type: "boolean",
    description: "Run with verbose logging",
  })
  .demandCommand(1)
  .parse();
