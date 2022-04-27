import path from "path";
import fs from "fs";
import { codegen } from "./codegen";

const [, , schemaArgPath, outputPath] = process.argv;

const generateSchema = async () => {
  const schemaPath = path.resolve(schemaArgPath);

  const isOutputPathADir = path.extname(outputPath).length === 0;
  const codeDir = isOutputPathADir ? outputPath : path.dirname(outputPath);
  const codeFilename = isOutputPathADir
    ? `${path.basename(schemaPath, path.extname(schemaPath))}.generated.ts`
    : path.basename(outputPath);
  const codePath = path.join(codeDir, codeFilename);
  const schema = await (await fs.promises.readFile(schemaPath)).toString();

  const code = codegen({ schema });

  await fs.promises.writeFile(codePath, code);

  console.log(schemaPath);
};

generateSchema();
