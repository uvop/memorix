import { getScopes } from "./scope";
import {
  getValueFromString,
  ValueType,
  PropertyType,
  ValueTypes,
  SimpleValueType,
  ArrayValueType,
  StringValueType,
} from "./value";
import { getJsonFromString } from "./json";
import {
  assertUnreachable,
  camelCase,
  removeBracketsOfScope,
} from "./utilities";

export type CacheDefaultOptions = {
  expire?: {
    value: number;
    isInMs?: boolean;
    extendOnGet?: boolean;
  };
};

export type TaskDefaultOptions = {
  takeNewest: boolean;
};

export type DefaultOptions = {
  cache?: CacheDefaultOptions;
  task?: TaskDefaultOptions;
};

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
  values: Map<
    string,
    {
      key?: ValueType;
      payload: ValueType;
      options?: CacheDefaultOptions;
    }
  >;
};
export type BlockPubsub = {
  type: BlockTypes.pubsub;
  values: Map<
    string,
    {
      key?: ValueType;
      payload: ValueType;
    }
  >;
};
export type BlockTask = {
  type: BlockTypes.task;
  values: Map<
    string,
    {
      key?: ValueType;
      payload: ValueType;
      returns?: ValueType;
      options?: TaskDefaultOptions;
    }
  >;
};

export type Block =
  | BlockModel
  | BlockEnum
  | BlockCache
  | BlockPubsub
  | BlockTask;

export const getBlocks: (scopes: ReturnType<typeof getScopes>) => Block[] = (
  namespaceScopes
) => {
  const blocks = namespaceScopes
    .filter((x) => !x.name.startsWith("Namespace"))
    .filter((x) => ["Config", "DefaultOptions"].indexOf(x.name) === -1)
    .map<Block>((n) => {
      const isNamelessNamespace =
        [BlockTypes.cache, BlockTypes.pubsub, BlockTypes.task].indexOf(
          n.name as BlockTypes
        ) !== -1;
      if (isNamelessNamespace) {
        const blockType = n.name as
          | BlockTypes.cache
          | BlockTypes.pubsub
          | BlockTypes.task;

        const values:
          | BlockCache["values"]
          | BlockPubsub["values"]
          | BlockTask["values"] = new Map();
        const scopes = getScopes(removeBracketsOfScope(n.scope));
        scopes.forEach((cn) => {
          const value = getValueFromString(cn.scope, ["options"]);
          if (value.type !== ValueTypes.object) {
            throw new Error(`Expected object under "${blockType}.${cn.name}"`);
          }

          const payload = value.properties.find((p) => p.name === "payload");
          if (!payload) {
            throw new Error(
              `Couldn't find "payload" under ${blockType}.${cn.name}`
            );
          }
          const existingValue = values.get(cn.name);
          if (existingValue) {
            throw new Error(`${blockType}.${cn.name} is already defined once.`);
          }
          const options = value.properties.find((p) => p.name === "options");

          values.set(cn.name, {
            key: value.properties.find((p) => p.name === "key")?.value,
            payload: payload.value,
            returns:
              blockType === BlockTypes.task
                ? value.properties.find((p) => p.name === "returns")?.value
                : undefined,
            options:
              options !== undefined && options.value.type === ValueTypes.string
                ? getJsonFromString(options.value.content)
                : undefined,
          });
        });

        return {
          type: blockType,
          values,
        } as BlockCache | BlockPubsub | BlockTask;
      }
      const match = /(?<type>(Model|Enum)) (?<name>.*)/g.exec(n.name);

      if (!match || !match.groups) {
        throw new Error(`Invalid scope "${n.name}"`);
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
): SimpleValueType | ArrayValueType | StringValueType => {
  switch (value.type) {
    case ValueTypes.string:
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
      return undefined as any;
  }
};

const getBlockModelsFromValue = (
  value: ValueType,
  name: string
): BlockModel[] => {
  switch (value.type) {
    case ValueTypes.string:
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
      return undefined as any;
  }
};

export const flatBlocks = (blocks: Block[], parentName: string): Block[] => {
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
            Array.from(b.values.entries())
              .filter(([, v]) => v.key !== undefined)
              .map(([name, v]) =>
                getBlockModelsFromValue(
                  v.key!,
                  `${parentName}${b.type}${camelCase(name)}Key`
                )
              )
              .flat()
          );
          newBlocks = newBlocks.concat(
            Array.from(b.values.entries())
              .map(([name, v]) =>
                getBlockModelsFromValue(
                  v.payload,
                  `${parentName}${b.type}${camelCase(name)}Payload`
                )
              )
              .flat()
          );
          newBlocks = newBlocks.concat(
            Array.from(b.values.entries())
              .filter(([, v]) => v.returns !== undefined)
              .map(([name, v]) =>
                getBlockModelsFromValue(
                  v.returns!,
                  `${parentName}${b.type}${camelCase(name)}Returns`
                )
              )
              .flat()
          );
          newBlocks = newBlocks.concat([
            {
              type: BlockTypes.task,
              values: new Map(
                Array.from(b.values.entries()).map(([name, v]) => [
                  name,
                  {
                    ...v,
                    key: v.key
                      ? getNonObjectValueFromValue(
                          v.key,
                          `${parentName}${b.type}${camelCase(name)}Key`
                        )
                      : undefined,
                    payload: getNonObjectValueFromValue(
                      v.payload,
                      `${parentName}${b.type}${camelCase(name)}Payload`
                    ),
                    returns: v.returns
                      ? getNonObjectValueFromValue(
                          v.returns,
                          `${parentName}${b.type}${camelCase(name)}Returns`
                        )
                      : undefined,
                  },
                ])
              ),
            },
          ]);
          break;
        }
        case BlockTypes.cache:
        case BlockTypes.pubsub: {
          newBlocks = newBlocks.concat(
            Array.from(b.values.entries())
              .filter(([, v]) => v.key !== undefined)
              .map(([name, v]) =>
                getBlockModelsFromValue(
                  v.key!,
                  `${parentName}${b.type}${camelCase(name)}Key`
                )
              )
              .flat()
          );
          newBlocks = newBlocks.concat(
            Array.from(b.values.entries())
              .map(([name, v]) =>
                getBlockModelsFromValue(
                  v.payload,
                  `${parentName}${b.type}${camelCase(name)}Payload`
                )
              )
              .flat()
          );
          newBlocks = newBlocks.concat([
            {
              type: b.type,
              values: new Map(
                Array.from(b.values.entries()).map(([name, v]) => [
                  name,
                  {
                    ...v,
                    key: v.key
                      ? getNonObjectValueFromValue(
                          v.key,
                          `${parentName}${b.type}${camelCase(name)}Key`
                        )
                      : undefined,
                    payload: getNonObjectValueFromValue(
                      v.payload,
                      `${parentName}${b.type}${camelCase(name)}Payload`
                    ),
                  },
                ])
              ),
            },
          ]);
          break;
        }
        default: {
          assertUnreachable(b);
        }
      }
    });

  return [
    ...blocks.filter((b) => [BlockTypes.enum].indexOf(b.type) !== -1),
    ...newBlocks,
  ];
};
