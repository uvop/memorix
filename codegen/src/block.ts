import { getNamespaces } from "./namespace";

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
  scope: string;
};

export type Block = BlockModel | BlockCache;

export const getBlocks: (schema: string) => Block[] = (schema) => {
  const namespaces = getNamespaces(schema);

  const blocks = namespaces.map<Block>((n) => {
    if (n.name === BlockTypes.cache) {
      return {
        type: BlockTypes.cache,
        scope: n.scope,
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
