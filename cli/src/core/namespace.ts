import {
  BlockCache,
  BlockEnum,
  BlockModel,
  BlockPubsub,
  BlockTask,
  BlockTypes,
  DefaultOptions,
  getBlocks,
} from "./block";
import { getJsonFromString } from "./json";
import { Schema } from "./schema";
import { getScopes } from "./scope";
import { assertUnreachable, removeBracketsOfScope } from "./utilities";

type BlockWithValues = BlockCache | BlockPubsub | BlockTask;

export type Namespace = {
  defaultOptions?: DefaultOptions;
  enums: Map<string, BlockEnum>;
  models: Map<string, BlockModel>;
  cache?: BlockCache;
  pubsub?: BlockPubsub;
  task?: BlockTask;
  subNamespacesByName: Map<string, Namespace>;
};

const getNamespaceBySchema: (schema: Schema) => Namespace = ({
  scopes,
  path: schemaPath,
}) => {
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
    const namespace = getNamespaceBySchema({
      path: schemaPath,
      scopes: getScopes(removeBracketsOfScope(s.scope)),
      subSchemas: [],
    });

    if (subNamespacesByName.get(name)) {
      throw new Error(
        `Namespace.${name} is already defined once in schema "${schemaPath}".`
      );
    }

    subNamespacesByName.set(name, namespace);
  });

  const enums = new Map<string, BlockEnum>();
  const models = new Map<string, BlockModel>();
  const blockWithItems = new Map<BlockWithValues["type"], BlockWithValues>();

  blocks.forEach((block) => {
    switch (block.type) {
      case BlockTypes.enum:
      case BlockTypes.model: {
        const map = {
          [BlockTypes.enum]: enums,
          [BlockTypes.model]: models,
        }[block.type];
        const existingBlock = map.get(block.name);
        if (existingBlock) {
          throw new Error(
            `${block.type}.${block.name} is already defined once in schema "${schemaPath}".`
          );
        }
        if (block.type === BlockTypes.enum) {
          enums.set(block.name, block);
        } else {
          models.set(block.name, block);
        }
        break;
      }
      case BlockTypes.cache:
      case BlockTypes.pubsub:
      case BlockTypes.task: {
        let existingBlock = blockWithItems.get(block.type);
        if (!existingBlock) {
          existingBlock = {
            type: block.type,
            values: new Map(),
          } as BlockWithValues;
        }
        const newBlock = {
          type: block.type,
          values: new Map(),
        } as BlockWithValues;

        Array.from([
          ...Array.from(existingBlock.values.entries()),
          ...Array.from(block.values.entries()),
        ]).forEach(([name, value]) => {
          const existingValue = newBlock.values.get(name);
          if (existingValue) {
            throw new Error(
              `${block.type}.${name} is already defined once in different block in schema "${schemaPath}".`
            );
          }
          newBlock.values.set(name, value);
        });

        blockWithItems.set(block.type, newBlock);
        break;
      }
      default: {
        assertUnreachable(block);
        break;
      }
    }
  });

  return {
    schemaPath,
    defaultOptions,
    enums,
    models,
    cache: blockWithItems.get(BlockTypes.cache) as BlockCache | undefined,
    pubsub: blockWithItems.get(BlockTypes.pubsub) as BlockPubsub | undefined,
    task: blockWithItems.get(BlockTypes.task) as BlockTask | undefined,
    subNamespacesByName,
  };
};

const mergeMaps = <T, F>(
  values: T[],
  {
    getMap,
    getDuplicateMsg,
  }: {
    getMap: (obj: T) => Map<string, F>;
    getDuplicateMsg: (
      name: string,
      existing: {
        item: F;
        value: T;
      },
      current: {
        item: F;
        value: T;
      }
    ) => string;
  }
) => {
  const mergedMap = new Map<
    string,
    {
      item: F;
      value: T;
    }
  >();

  values.forEach((value) => {
    Array.from(getMap(value).entries()).forEach(([name, item]) => {
      const existing = mergedMap.get(name);
      const current = { item, value };
      if (existing) {
        throw new Error(getDuplicateMsg(name, existing, current));
      }

      mergedMap.set(name, current);
    });
  });

  return new Map<string, F>(
    Array.from(mergedMap.entries()).map(([name, { item }]) => [name, item])
  );
};

export const getNamespace: (schema: Schema) => Namespace = (schema) => {
  const schemaNamespace = {
    schemaPath: schema.path,
    namespace: getNamespaceBySchema(schema),
  };
  const subSchemaNamespaces = schema.subSchemas.map((x) => ({
    schemaPath: x.path,
    namespace: getNamespace(x),
  }));

  const schemaNamespaces = [...subSchemaNamespaces, schemaNamespace];

  return {
    defaultOptions: schemaNamespace.namespace.defaultOptions,
    enums: mergeMaps(schemaNamespaces, {
      getMap: (x) => x.namespace.enums,
      getDuplicateMsg: (
        name,
        existing,
        current
      ) => `Enum.${name} is already defined once.
First time: "${existing.value.schemaPath}".
Now: "${current.value.schemaPath}".`,
    }),
    models: mergeMaps(schemaNamespaces, {
      getMap: (x) => x.namespace.models,
      getDuplicateMsg: (
        name,
        existing,
        current
      ) => `Enum.${name} is already defined once.
First time: "${existing.value.schemaPath}".
Now: "${current.value.schemaPath}".`,
    }),
    cache: schemaNamespaces.some((x) => x.namespace.cache)
      ? {
          type: BlockTypes.cache,
          values: mergeMaps(
            schemaNamespaces.filter((x) => x.namespace.cache),
            {
              getMap: (x) => x.namespace.cache!.values,
              getDuplicateMsg: (
                name,
                existing,
                current
              ) => `Cache.${name} is already defined once.
First time: "${existing.value.schemaPath}".
Now: "${current.value.schemaPath}".`,
            }
          ),
        }
      : undefined,
    pubsub: schemaNamespaces.some((x) => x.namespace.pubsub)
      ? {
          type: BlockTypes.pubsub,
          values: mergeMaps(
            schemaNamespaces.filter((x) => x.namespace.pubsub),
            {
              getMap: (x) => x.namespace.pubsub!.values,
              getDuplicateMsg: (
                name,
                existing,
                current
              ) => `Pubsub.${name} is already defined once.
First time: "${existing.value.schemaPath}".
Now: "${current.value.schemaPath}".`,
            }
          ),
        }
      : undefined,
    task: schemaNamespaces.some((x) => x.namespace.task)
      ? {
          type: BlockTypes.task,
          values: mergeMaps(
            schemaNamespaces.filter((x) => x.namespace.task),
            {
              getMap: (x) => x.namespace.task!.values,
              getDuplicateMsg: (
                name,
                existing,
                current
              ) => `Task.${name} is already defined once.
First time: "${existing.value.schemaPath}".
Now: "${current.value.schemaPath}".`,
            }
          ),
        }
      : undefined,
    subNamespacesByName: mergeMaps(schemaNamespaces, {
      getMap: (x) => x.namespace.subNamespacesByName,
      getDuplicateMsg: (
        name,
        existing,
        current
      ) => `Namespace.${name} is already defined once.
First time: "${existing.value.schemaPath}".
Now: "${current.value.schemaPath}".`,
    }),
  };
};
