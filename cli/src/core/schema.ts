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
  schemaFilePath: string;
  dirname?: string;
}) => Promise<Schema> = async ({ schemaFilePath, dirname }) => {
  const schemaPath =
    dirname !== undefined
      ? path.resolve(dirname, schemaFilePath)
      : path.resolve(schemaFilePath);
  const schemaFolder = path.dirname(schemaPath);
  const schema = await (await fs.promises.readFile(schemaPath)).toString();

  const scopes = getScopes(schema);
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

  return {
    path: schemaPath,
    config,
    scopes,
    subSchemas: await Promise.all(
      schemaExtendFilePaths.map((schemaExtendFilePath) =>
        getSchema({
          schemaFilePath: schemaExtendFilePath,
          dirname: schemaFolder,
        })
      )
    ),
  };
};
