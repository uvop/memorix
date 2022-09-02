#!/usr/bin/env node
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import { Languages } from "./languages";
import { codegen } from "./codgen";

yargs(hideBin(process.argv))
  .command(
    "codegen <schemaFilePath> <...files>",
    "Codegen memorix schema to code",
    (b) => {
      return b
        .positional("schemaFilePath", {
          describe: "Memorix schema file",
        })
        .positional("files", {
          describe: "Pairs of language to codegen and destination file",
        });
    },
    (argv) => {
      const { schemaFilePath, files } = argv as {
        schemaFilePath: string;
        files: string[];
      };
      const parsedFiles: Parameters<typeof codegen>[0]["files"] = [];
      for (let index = 0; index < files.length; index += 2) {
        const languageStr = files[index];
        const dist = files[index + 1];
        const language = Languages[languageStr];
        if (language === undefined) {
          throw new Error(
            `Unknown language, got "${languageStr}", expected one of "${Object.keys(
              Languages
            ).join(", ")}"`
          );
        }
        if (dist === undefined) {
          throw new Error(`Must pass path for "${language}" codegen`);
        }
        parsedFiles.push({
          dist,
          language,
        });
      }
      if (parsedFiles.length === 0) {
        throw new Error(`Didn't get any languages to codegen`);
      }
      codegen({
        schemaFilePath,
        files: parsedFiles,
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
