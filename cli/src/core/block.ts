import { Languages } from "src/languages";
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

export enum BlockTypes {
  model = "Model",
  enum = "Enum",
  cache = "Cache",
  pubsub = "PubSub",
  task = "Task",
}

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

export type DefaultOptions = {
  cache?: CacheDefaultOptions;
  task?: TaskDefaultOptions;
};

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
    options?: CacheDefaultOptions;
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
    options?: TaskDefaultOptions;
  }[];
};

export type Block =
  | BlockModel
  | BlockEnum
  | BlockCache
  | BlockPubsub
  | BlockTask;

export type Namespace = {
  defaults?: DefaultOptions;
  blocks: Block[];
};

export type Namespaces = {
  global: Namespace;
  named: ({ name: string } & Namespace)[];
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

const getBlocks: (content: string) => Block[] = (content) => {
  const namespaceScopes = getScopes(content);

  const blocks = namespaceScopes.map<Block>((n) => {
    const isNamelessNamespace =
      [BlockTypes.cache, BlockTypes.pubsub, BlockTypes.task].indexOf(
        n.name as BlockTypes
      ) !== -1;
    if (isNamelessNamespace) {
      const blockType = n.name as
        | BlockTypes.cache
        | BlockTypes.pubsub
        | BlockTypes.task;

      const scopes = getScopes(removeBracketsOfScope(n.scope));

      return {
        type: blockType,
        values: scopes.map((cn) => {
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
          const options = value.properties.find((p) => p.name === "options");

          return {
            name: cn.name,
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
          };
        }),
      };
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

const getNamespace: (content: string) => Namespace = (content) => {
  const blocks = getBlocks(content);
  const scopes = getScopes(content);
  const defaultOptions = scopes.find((x) => x.name === "DefaultOptions");
  if (!defaultOptions) {
    return {
      blocks,
    };
  }

  const json = getJsonFromString(defaultOptions.scope);
  if (typeof json !== "object") {
    throw new Error(`Expected object under "DefaultOptions"`);
  }
  return {
    blocks,
    defaults: json,
  };
};

export const getNamespaces: (schema: string) => Namespaces = (schema) => {
  const scopes = getScopes(schema);

  return {
    global: getNamespace(schema),
    named: scopes
      .filter((s) => s.name.startsWith("Namespace"))
      .map((s) => {
        const match = /(?<type>(Namespace)) (?<name>.*)/g.exec(s.name);
        const name = match.groups.name.trim() as string;

        return {
          name,
          ...getNamespace(s.scope),
        };
      }),
  };
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

const flatBlocks = (blocks: Block[]): Block[] => {
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
                  v.returns!,
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

  return [
    ...blocks.filter((b) => [BlockTypes.enum].indexOf(b.type) !== -1),
    ...newBlocks,
  ];
};

const flatNamespace: (namespace: Namespace) => Namespace = (namespace) => {
  return {
    ...namespace,
    blocks: flatBlocks(namespace.blocks),
  };
};

export const flatNamespaces: (namespaces: Namespaces) => Namespaces = (
  namespaces
) => {
  return {
    global: flatNamespace(namespaces.global),
    named: namespaces.named.map((n) => ({
      ...n,
      ...flatNamespace(n),
    })),
  };
};
