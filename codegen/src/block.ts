import { getNamespaces } from "./namespace";
import {
  getValueFromString,
  ValueType,
  PropertyType,
  ValueTypes,
} from "./value";
import { removeBracketsOfScope } from "./utilities";

export enum BlockTypes {
  model = "Model",
  enum = "Enum",
  cache = "Cache",
  pubsub = "PubSub",
  task = "Task",
}

export type BlockModel = {
  type: BlockTypes.model;
  name: string;
  properties: PropertyType[];
};

export type BlockEnum = {
  type: BlockTypes.enum;
  name: string;
  values: string[];
};

export type BlockCache = {
  type: BlockTypes.cache;
  values: {
    name: string;
    key?: ValueType;
    payload: ValueType;
  }[];
};
export type BlockPubsub = {
  type: BlockTypes.pubsub;
  values: {
    name: string;
    key?: ValueType;
    payload: ValueType;
  }[];
};
export type BlockTask = {
  type: BlockTypes.task;
  values: {
    name: string;
    key?: ValueType;
    payload: ValueType;
    returns?: ValueType;
  }[];
};

export type Block =
  | BlockModel
  | BlockEnum
  | BlockCache
  | BlockPubsub
  | BlockTask;

export const getBlocks: (schema: string) => Block[] = (schema) => {
  const namespaces = getNamespaces(schema);

  const blocks = namespaces.map<Block>((n) => {
    const isNamelessNamespace =
      [BlockTypes.cache, BlockTypes.pubsub, BlockTypes.task].indexOf(
        n.name as BlockTypes
      ) !== -1;
    if (isNamelessNamespace) {
      const blockType = n.name as
        | BlockTypes.cache
        | BlockTypes.pubsub
        | BlockTypes.task;
      const cacheNamespaces = getNamespaces(removeBracketsOfScope(n.scope));

      return {
        type: blockType,
        values: cacheNamespaces.map((cn) => {
          const value = getValueFromString(cn.scope);
          if (value.type !== ValueTypes.object) {
            throw new Error(`Expected object under "${blockType}.${cn.name}"`);
          }

          const payload = value.properties.find((p) => p.name === "payload");
          if (!payload) {
            throw new Error(`Couldn't find "payload" under Cache.${cn.name}`);
          }

          return {
            name: cn.name,
            key: value.properties.find((p) => p.name === "key")?.value,
            payload: payload.value,
            returns:
              blockType === BlockTypes.task
                ? value.properties.find((p) => p.name === "returns")?.value
                : undefined,
          };
        }),
      };
    }
    const match = /(?<type>(Model|Enum)) (?<name>.*)/g.exec(n.name);

    if (!match) {
      throw new Error(`Invalid namespace "${n.name}"`);
    }

    const blockType = match.groups.type as BlockTypes.model | BlockTypes.enum;
    const name = match.groups.name.trim() as string;

    if (blockType === BlockTypes.enum) {
      return {
        type: blockType,
        name,
        values: removeBracketsOfScope(n.scope)
          .split("\n")
          .map((x) => x.trim())
          .filter((x) => x.length > 0),
      };
    }

    const value = getValueFromString(n.scope);
    if (value.type !== ValueTypes.object) {
      throw new Error(`Expected object under "${blockType}.${n.name}"`);
    }

    return {
      type: blockType,
      name,
      properties: value.properties,
    };
  });

  return blocks;
};
