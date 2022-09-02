import { getNamespaces } from "./namespace";
import {
  getValueFromString,
  ValueType,
  PropertyType,
  ValueTypes,
  SimpleValueType,
  ArrayValueType,
} from "./value";
import {
  assertUnreachable,
  camelCase,
  removeBracketsOfScope,
} from "./utilities";

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

    if (!match || !match.groups) {
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

const getNonObjectValueFromValue = (
  value: ValueType,
  name: string
): SimpleValueType | ArrayValueType => {
  switch (value.type) {
    case ValueTypes.simple:
      return value;
    case ValueTypes.array:
      return {
        ...value,
        value: getNonObjectValueFromValue(value.value, name),
      };
    case ValueTypes.object:
      return {
        type: ValueTypes.simple,
        isOptional: value.isOptional,
        name,
      };
    default:
      assertUnreachable(value);
      return undefined;
  }
};

const getBlockModelsFromValue = (
  value: ValueType,
  name: string
): BlockModel[] => {
  switch (value.type) {
    case ValueTypes.simple:
      return [];
    case ValueTypes.object:
      return [
        ...value.properties
          .map((p) =>
            getBlockModelsFromValue(p.value, `${name}${camelCase(p.name)}`)
          )
          .flat(),
        {
          type: BlockTypes.model,
          name,
          properties: value.properties.map((p) => ({
            name: p.name,
            value: getNonObjectValueFromValue(
              p.value,
              `${name}${camelCase(p.name)}`
            ),
          })),
        },
      ];
    case ValueTypes.array:
      return getBlockModelsFromValue(value.value, name);
    default:
      assertUnreachable(value);
      return undefined;
  }
};

export const flatBlocks = (blocks: Block[]): Block[] => {
  let newBlocks: Block[] = [];

  blocks
    .filter((b) => [BlockTypes.enum].indexOf(b.type) === -1)
    .forEach((b) => {
      switch (b.type) {
        case BlockTypes.enum:
          break;
        case BlockTypes.model: {
          newBlocks = newBlocks.concat(
            getBlockModelsFromValue(
              {
                type: ValueTypes.object,
                isOptional: false,
                properties: b.properties,
              },
              b.name
            )
          );
          break;
        }
        case BlockTypes.task: {
          newBlocks = newBlocks.concat(
            b.values
              .filter((v) => v.key !== undefined)
              .map((v) =>
                getBlockModelsFromValue(
                  v.key!,
                  `${b.type}${camelCase(v.name)}Key`
                )
              )
              .flat()
          );
          newBlocks = newBlocks.concat(
            b.values
              .map((v) =>
                getBlockModelsFromValue(
                  v.payload,
                  `${b.type}${camelCase(v.name)}Payload`
                )
              )
              .flat()
          );
          newBlocks = newBlocks.concat(
            b.values
              .filter((v) => v.returns !== undefined)
              .map((v) =>
                getBlockModelsFromValue(
                  v.returns,
                  `${b.type}${camelCase(v.name)}Returns`
                )
              )
              .flat()
          );
          newBlocks = newBlocks.concat([
            {
              type: BlockTypes.task,
              values: b.values.map((v) => ({
                ...v,
                key: v.key
                  ? getNonObjectValueFromValue(
                      v.key,
                      `${b.type}${camelCase(v.name)}Key`
                    )
                  : undefined,
                payload: getNonObjectValueFromValue(
                  v.payload,
                  `${b.type}${camelCase(v.name)}Payload`
                ),
                returns: v.returns
                  ? getNonObjectValueFromValue(
                      v.returns,
                      `${b.type}${camelCase(v.name)}Returns`
                    )
                  : undefined,
              })),
            },
          ]);
          break;
        }
        case BlockTypes.cache:
        case BlockTypes.pubsub: {
          newBlocks = newBlocks.concat(
            b.values
              .filter((v) => v.key !== undefined)
              .map((v) =>
                getBlockModelsFromValue(
                  v.key!,
                  `${b.type}${camelCase(v.name)}Key`
                )
              )
              .flat()
          );
          newBlocks = newBlocks.concat(
            b.values
              .map((v) =>
                getBlockModelsFromValue(
                  v.payload,
                  `${b.type}${camelCase(v.name)}Payload`
                )
              )
              .flat()
          );
          newBlocks = newBlocks.concat([
            {
              type: b.type,
              values: b.values.map((v) => ({
                ...v,
                key: v.key
                  ? getNonObjectValueFromValue(
                      v.key,
                      `${b.type}${camelCase(v.name)}Key`
                    )
                  : undefined,
                payload: getNonObjectValueFromValue(
                  v.payload,
                  `${b.type}${camelCase(v.name)}Payload`
                ),
              })),
            },
          ]);
          break;
        }
        default: {
          assertUnreachable(b);
        }
      }
    });

  return [...blocks.filter((b) => b.type === BlockTypes.enum), ...newBlocks];
};