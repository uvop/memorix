import path from "path";
import fs from "fs";
import { codegen } from "./codegen";
import { Languages } from "./languages";

const [, , schemaArgPath, outputPath] = process.argv;

const generateSchema = async () => {
  const schemaPath = path.resolve(schemaArgPath);

  const isOutputPathDefined = !!outputPath;
  const isOutputPathADir =
    isOutputPathDefined && path.extname(outputPath).length === 0;

  // eslint-disable-next-line no-nested-ternary
  const codeDir = isOutputPathDefined
    ? isOutputPathADir
      ? outputPath
      : path.dirname(outputPath)
    : path.dirname(schemaPath);
  const codeFilename =
    isOutputPathADir || !isOutputPathDefined
      ? `${path.basename(schemaPath, path.extname(schemaPath))}.generated.ts`
      : path.basename(outputPath);
  const codePath = path.join(codeDir, codeFilename);

  const schema = await (await fs.promises.readFile(schemaPath)).toString();

  const code = codegen({ schema, language: Languages.typescript });

  await fs.promises.writeFile(codePath, code);

  console.log(schemaPath);
};

generateSchema();
