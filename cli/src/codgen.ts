import path from "path";
import fs from "fs";
import { codegenByLanguage, Languages } from "./languages";

export const codegen = async ({
  schemaFilePath,
  files,
}: {
  schemaFilePath: string;
  files: { language: Languages; dist: string }[];
}) => {
  const schemaPath = path.resolve(schemaFilePath);

  await Promise.all(
    files.map(async ({ language, dist: outputPath }) => {
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
          ? `${path.basename(
              schemaPath,
              path.extname(schemaPath)
            )}.generated.ts`
          : path.basename(outputPath);
      const codePath = path.join(codeDir, codeFilename);

      const schema = await (await fs.promises.readFile(schemaPath)).toString();

      const code = codegenByLanguage(schema, language);

      await fs.promises.writeFile(codePath, code);
    })
  );
};
