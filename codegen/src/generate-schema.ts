import path from "path";
import fs from "fs";
import { codegen } from "./codegen";

const [, , schemaArgPath] = process.argv;

const generateSchema = async () => {
  const schemaPath = path.resolve(schemaArgPath);
  const codePath = path.join(
    path.dirname(schemaPath),
    `${path.basename(schemaPath, path.extname(schemaPath))}.generated.ts`
  );
  const schema = await (await fs.promises.readFile(schemaPath)).toString();

  const code = codegen({ schema });

  await fs.promises.writeFile(codePath, code);

  console.log(schemaPath);
};

generateSchema();
