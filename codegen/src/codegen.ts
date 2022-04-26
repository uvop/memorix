export enum Languages {
  typescript,
}

export const assertUnreachable: (x: never) => never = () => {
  throw new Error("Didn't expect to get here");
};

type CodegenFn = (params: { schema: string; language?: Languages }) => string;

type PropertyType = {
  name: string;
  value: string;
  isOptional: boolean;
  isValueAScope: boolean;
};

const getPropertiesOfScope: (scope: string) => PropertyType[] = (scope) => {
  const scopeWithoutBraces = scope.substring(1, scope.length - 1).trim();

  const properties: PropertyType[] = [];
  let index = 0;

  while (index < scopeWithoutBraces.length) {
    const partOfScope = scopeWithoutBraces.substring(index);
    const nameEndIndex = partOfScope.indexOf(":");
    const name = partOfScope.substring(0, nameEndIndex).trim();
    index += nameEndIndex + 1;

    const partOfScopeForValue = partOfScope.substring(nameEndIndex + 1);
    const newLineIndex = partOfScopeForValue.indexOf("\n");
    const endOfLineIndex =
      newLineIndex === -1 ? partOfScopeForValue.length - 1 : newLineIndex + 1;
    const newScopeIndex = partOfScopeForValue.indexOf("{");

    if (newScopeIndex !== -1 && newScopeIndex < endOfLineIndex) {
      let unclosedBracketCount = 1;
      let newScopeIndexEnd = newScopeIndex + 1;
      while (unclosedBracketCount !== 0) {
        const partForBracketSearch =
          partOfScopeForValue.substring(newScopeIndexEnd);
        const nextBracketOpen = partForBracketSearch.indexOf("{");
        const nextBracketClose = partForBracketSearch.indexOf("}");
        if (nextBracketOpen === -1 || nextBracketClose < nextBracketOpen) {
          unclosedBracketCount -= 1;
          newScopeIndexEnd += nextBracketClose + 1;
        } else {
          unclosedBracketCount += 1;
          newScopeIndexEnd += nextBracketOpen + 1;
        }
      }

      const value = partOfScopeForValue
        .substring(newScopeIndex, newScopeIndex + newScopeIndexEnd - 1)
        .trim();

      const partOfAfterScopeEnd = partOfScopeForValue.substring(
        newScopeIndex + newScopeIndexEnd - 1
      );
      const newLineAfterScopeEndIndex = partOfAfterScopeEnd.indexOf("\n");
      const endOfLineAfterScopeEndIndex =
        newLineAfterScopeEndIndex === -1
          ? partOfAfterScopeEnd.length - 1
          : newLineAfterScopeEndIndex + 1;
      const optionalAfterScopeEndIndex = partOfAfterScopeEnd.indexOf("?");

      const isOptional =
        optionalAfterScopeEndIndex !== -1 &&
        optionalAfterScopeEndIndex <= endOfLineAfterScopeEndIndex;

      properties.push({
        name,
        value,
        isOptional,
        isValueAScope: true,
      });
      index += newScopeIndex + newScopeIndexEnd + 1;
    } else {
      const optionalIndex = partOfScopeForValue.indexOf("?");
      const isOptional =
        optionalIndex !== -1 && optionalIndex <= endOfLineIndex;
      const value = partOfScopeForValue
        .substring(0, isOptional ? optionalIndex : endOfLineIndex + 1)
        .trim();

      properties.push({
        name,
        value,
        isOptional,
        isValueAScope: false,
      });
      index += endOfLineIndex + 1;
    }
  }

  return properties;
};

const scopeToTs: (scope: string, level?: number) => string = (
  scope,
  level = 0
) => {
  const properties = getPropertiesOfScope(scope);
  const spaces = Array.from({ length: level })
    .map(() => "    ")
    .join("");
  const nextSpaces = Array.from({ length: level + 1 })
    .map(() => "    ")
    .join("");

  return `{
${nextSpaces}${properties
    .map(
      (prop) =>
        `${prop.name}${prop.isOptional ? "?" : ""}: ${
          prop.isValueAScope ? scopeToTs(prop.value, level + 1) : prop.value
        };`
    )
    .join(`\n${nextSpaces}`)}
${spaces}}`;
};

const getIndicesOf = (str: string, searchStr: string) => {
  const searchStrLen = searchStr.length;
  if (searchStrLen === 0) {
    return [];
  }

  const indices: number[] = [];
  let startIndex = 0;
  let index = str.indexOf(searchStr, startIndex);
  while (index > -1) {
    indices.push(index);
    startIndex = index + searchStrLen;

    index = str.indexOf(searchStr, startIndex);
  }
  return indices;
};

enum BlockTypes {
  model = "Model",
  cache = "Cache",
}

type BlockModel = {
  type: BlockTypes.model;
  name: string;
  scope: string;
};
type BlockCache = {
  type: BlockTypes.cache;
  scope: string;
};

type Block = BlockModel | BlockCache;

const getBlocks: (schema: string) => Block[] = (schema) => {
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

export const codegen: CodegenFn = ({ schema }) => {
  const blocks = getBlocks(schema);

  const hasCache = blocks.filter((b) => b.type === BlockTypes.cache).length > 0;
  const hasApi = hasCache;

  return `${
    hasApi
      ? `import { ${[]
          .concat(hasCache ? ["cacheGet", "cacheSet"] : [])
          .join(", ")} } from "@memorix/client-js";`
      : ""
  }${blocks
    .filter((b) => b.type === BlockTypes.model)
    .map((b: BlockModel) => `export interface ${b.name} ${scopeToTs(b.scope)}`)
    .join("\n\n")}${
    hasApi
      ? `\n\nexport const api = {
${blocks
  .filter((b) => b.type === BlockTypes.cache)
  .map((b: BlockCache) => ``)
  .join("\n\n")}
}`
      : ""
  }`;
};
