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
      const filePath = path.resolve(schema.dirname, file);
      const code = codegenByLanguage(namespace, language);
      await fs.promises.writeFile(filePath, code);
    })
  );
};

export const codegen = async ({
  schemaFilePath,
}: {
  schemaFilePath: string;
}) => {
  const schema = await getSchema({ schemaFilePath });
  await codegenSchema(schema);
};
