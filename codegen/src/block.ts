import { getNamespaces } from "./namespace";
import { getProperties, PropertyType } from "./property";
import { removeBracketsOfScope } from "./utilities";

export enum BlockTypes {
  model = "Model",
  cache = "Cache",
  pubsub = "PubSub",
  task = "Task",
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
export type BlockPubsub = {
  type: BlockTypes.pubsub;
  values: {
    name: string;
    key?: PropertyType;
    payload: PropertyType;
  }[];
};
export type BlockTask = {
  type: BlockTypes.task;
  values: {
    name: string;
    key?: PropertyType;
    payload: PropertyType;
    returns?: PropertyType;
  }[];
};

export type Block = BlockModel | BlockCache | BlockPubsub | BlockTask;

export const getBlocks: (schema: string) => Block[] = (schema) => {
  const namespaces = getNamespaces(schema);

  const blocks = namespaces.map<Block>((n) => {
    const blockType =
      [BlockTypes.cache, BlockTypes.pubsub, BlockTypes.task].indexOf(
        n.name as BlockTypes
      ) !== -1
        ? (n.name as BlockTypes)
        : BlockTypes.model;
    if (blockType !== BlockTypes.model) {
      const cacheNamespaces = getNamespaces(removeBracketsOfScope(n.scope));

      return {
        type: blockType,
        values: cacheNamespaces.map((cn) => {
          const properties = getProperties(removeBracketsOfScope(cn.scope));
          const payload = properties.find((p) => p.name === "payload");
          if (!payload) {
            throw new Error(`Couldn't find "payload" under Cache.${cn.name}`);
          }

          return {
            name: cn.name,
            key: properties.find((p) => p.name === "key"),
            payload,
            returns:
              blockType === BlockTypes.task
                ? properties.find((p) => p.name === "returns")
                : undefined,
          };
        }),
      };
    }
    const match = /Model (?<name>.*)/g.exec(n.name);

    if (!match) {
      throw new Error(`Invalid namespace "${n.name}"`);
    }

    return {
      type: blockType,
      name: match.groups.name.trim() as string,
      scope: n.scope,
    };
  });

  return blocks;
};
