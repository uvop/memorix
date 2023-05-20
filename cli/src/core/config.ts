import { Languages } from "src/languages";
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

export const getConfig: (schema: string) => Config | undefined = (schema) => {
  const scopes = getScopes(schema);
  const configScope = scopes.find((x) => x.name === "Config");
  if (!configScope) {
    return undefined;
  }

  const json = getJsonFromString(configScope.scope);
  if (typeof json !== "object") {
    throw new Error(`Expected object under "Config"`);
  }
  return json;
};
