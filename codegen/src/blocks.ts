import { assertUnreachable, getIndicesOf } from "./utilities";

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
  const modelIndices = getIndicesOf(schema, BlockTypes.model);
  const cacheIndices = getIndicesOf(schema, BlockTypes.cache);

  if (cacheIndices.length > 1) {
    throw new Error("More than 1 cache can't be defined.");
  }

  return [
    ...cacheIndices.map((i) => ({ type: BlockTypes.cache, index: i })),
    ...modelIndices.map((i) => ({ type: BlockTypes.model, index: i })),
  ].map((x, i) => {
    const modelIndex = x.index;
    const nextModelIndex = modelIndices[i + 1];
    const blockSchema = schema.substring(modelIndex, nextModelIndex);

    switch (x.type) {
      case BlockTypes.model: {
        const match = /Model (?<name>[^{ ]+)(?<scope>[^]*)/g.exec(blockSchema);

        if (!match) {
          throw new Error(`Couldn't run regex on model schema:
          ${blockSchema}`);
        }
        return {
          type: BlockTypes.model,
          name: match.groups.name,
          scope: match.groups.scope.trim(),
        };
      }
      case BlockTypes.cache: {
        const match = /Cache (?<scope>[^]*)/g.exec(blockSchema);

        if (!match) {
          throw new Error(`Couldn't run regex on cache schema:
          ${blockSchema}`);
        }

        return {
          type: BlockTypes.cache,
          scope: match.groups.scope.trim(),
        };
      }

      default:
        assertUnreachable(x.type);
    }
  });
};
