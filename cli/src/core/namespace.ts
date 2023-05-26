import { Block, DefaultOptions, getBlocks } from "./block";
import { getJsonFromString } from "./json";
import { Schema } from "./schema";
import { getScopes } from "./scope";
import { removeBracketsOfScope } from "./utilities";

export type Namespace = {
  defaultOptions?: DefaultOptions;
  blocks: Block[];
  subNamespacesByName: Map<string, Namespace>;
};

const getNamespaceByScopes: (scopes: Schema["scopes"]) => Namespace = (
  scopes
) => {
  const blocks = getBlocks(scopes);
  const defaultOptionsScope = scopes.find((x) => x.name === "DefaultOptions");
  const defaultOptions = defaultOptionsScope
    ? (getJsonFromString(defaultOptionsScope.scope) as DefaultOptions)
    : undefined;
  const subNamespacesByName = new Map<string, Namespace>();
  scopes.forEach((s) => {
    const match = /(?<type>Namespace) (?<name>.*)/g.exec(s.name);
    if (!match?.groups?.name) {
      return;
    }
    const name = match.groups.name.trim();
    const namespace = getNamespaceByScopes(
      getScopes(removeBracketsOfScope(s.scope))
    );

    subNamespacesByName.set(name, namespace);
  });

  return {
    defaultOptions,
    blocks,
    subNamespacesByName,
  };
};

export const getNamespace: (schema: Schema) => Namespace = (schema) => {
  const schemaNamespace = getNamespaceByScopes(schema.scopes);
  const subSchemaNamespaces = schema.subSchemas.map((x) => getNamespace(x));

  return {
    defaultOptions: schemaNamespace.defaultOptions,
    blocks: [
      ...subSchemaNamespaces.map((x) => x.blocks).flat(),
      ...schemaNamespace.blocks,
    ],
    subNamespacesByName: new Map([
      ...subSchemaNamespaces
        .map((x) => Array.from(x.subNamespacesByName.entries()))
        .flat(),
      ...Array.from(schemaNamespace.subNamespacesByName.entries()),
    ] as any),
  };
};
