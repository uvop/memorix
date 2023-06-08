import path from "path";
import fs from "fs";
import { codegenByLanguage } from "./languages";
import { Schema, getSchema } from "./core/schema";
import { getNamespace } from "./core/namespace";

const codegenSchema: (schema: Schema) => Promise<void> = async (schema) => {
  await Promise.all(schema.subSchemas.map(codegenSchema));

  if (!schema.config?.output) {
    return;
  }

  const output = Array.isArray(schema.config.output)
    ? schema.config.output
    : [schema.config.output];

  const namespace = getNamespace(schema);
  await Promise.all(
    output.map(async ({ language, file }) => {
      const filePath = path.resolve(path.dirname(schema.path), file);
      const code = codegenByLanguage(namespace, language);
      await fs.promises.writeFile(filePath, code);
    })
  );
};

export const codegen = async ({
  schemaFilePath,
}: {
  schemaFilePath: string[] | string;
}) => {
  await Promise.all(
    (Array.isArray(schemaFilePath) ? schemaFilePath : [schemaFilePath]).map(
      async (x) => {
        const schema = await getSchema({ schemaPath: path.resolve(x) });

        await codegenSchema(schema);
      }
    )
  );
};
