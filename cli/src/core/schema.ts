import { Languages } from "src/languages";
import path from "path";
import fs from "fs";
import { getScopes } from "./scope";
import { getJsonFromString } from "./json";

export type Config = {
  extends?: string | string[];
  output:
    | {
        language: Languages;
        file: string;
      }
    | {
        language: Languages;
        file: string;
      }[];
};

export type Schema = {
  path: string;
  config?: Omit<Config, "extends">;
  subSchemas: Schema[];
  scopes: ReturnType<typeof getScopes>;
};

export const getSchema: (params: {
  schemaPath: string;
  existingSchemasByPath?: Map<string, Schema>;
}) => Promise<Schema> = async ({
  schemaPath,
  existingSchemasByPath: parentExistingSchemasByPath,
}) => {
  const existingSchemasByPath =
    parentExistingSchemasByPath ?? new Map<string, Schema>();
  const existingSchema = existingSchemasByPath.get(schemaPath);
  if (existingSchema !== undefined) {
    return existingSchema;
  }
  const schemaContent = await (
    await fs.promises.readFile(schemaPath)
  ).toString();

  const scopes = getScopes(schemaContent);
  const configScope = scopes.find((x) => x.name === "Config");
  const config = configScope
    ? (getJsonFromString(configScope.scope) as Config)
    : undefined;

  // (nullable/single/array) to array
  // eslint-disable-next-line no-nested-ternary
  const schemaExtendFilePaths = config?.extends
    ? Array.isArray(config.extends)
      ? config.extends
      : [config.extends]
    : [];

  const schema: Schema = {
    path: schemaPath,
    config,
    scopes,
    subSchemas: await Promise.all(
      schemaExtendFilePaths.map((schemaExtendFilePath) =>
        getSchema({
          schemaPath: path.resolve(
            path.dirname(schemaPath),
            schemaExtendFilePath
          ),
          existingSchemasByPath,
        })
      )
    ),
  };
  existingSchemasByPath.set(schemaPath, schema);
  return schema;
};
