import { getNamespaces } from "./namespace";
import { getProperties, PropertyType } from "./property";
import { removeBracketsOfScope } from "./utilities";

export enum BlockTypes {
  model = "Model",
  cache = "Cache",
}

export type BlockModel = {
  type: BlockTypes.model;
  name: string;
  scope: string;
};

export type BlockCache = {
  type: BlockTypes.cache;
  values: {
    name: string;
    key?: PropertyType;
    payload: PropertyType;
  }[];
};

export type Block = BlockModel | BlockCache;

export const getBlocks: (schema: string) => Block[] = (schema) => {
  const namespaces = getNamespaces(schema);

  const blocks = namespaces.map<Block>((n) => {
    if (n.name === BlockTypes.cache) {
      const cacheNamespaces = getNamespaces(removeBracketsOfScope(n.scope));

      return {
        type: BlockTypes.cache,
        values: cacheNamespaces.map((cn) => {
          const properties = getProperties(removeBracketsOfScope(cn.scope));
          const payload = properties.find((p) => p.name === "payload");
          if (!payload) {
            throw new Error(`Couldn't find "payload" under Cache.${cn.name}`);
          }
          const key = properties.find((p) => p.name === "key");

          return {
            name: cn.name,
            key,
            payload,
          };
        }),
      };
    }
    const match = /Model (?<name>.*)/g.exec(n.name);

    if (!match) {
      throw new Error(`Invalid namespace "${n.name}"`);
    }

    return {
      type: BlockTypes.model,
      name: match.groups.name.trim() as string,
      scope: n.scope,
    };
  });

  return blocks;
};
