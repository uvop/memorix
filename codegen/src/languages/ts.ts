import { Block, BlockTypes, getBlocks } from "src/block";
import { getProperties } from "src/property";
import { assertUnreachable, removeBracketsOfScope } from "src/utilities";

const scopeToTs: (scope: string, level?: number) => string = (
  scope,
  level = 0
) => {
  const properties = getProperties(removeBracketsOfScope(scope));
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

const capitalizeFirstLetter = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const blockToTs: (block: Block) => string = (b) => {
  switch (b.type) {
    case BlockTypes.model:
      return `export interface ${b.name} ${scopeToTs(b.scope)}`;
    case BlockTypes.cache: {
      const spaces = Array.from({ length: 2 })
        .map(() => "    ")
        .join("");

      return `${b.values.map((v) => {
        return `${spaces}${v.name} = this.getCacheItem<${
          v.key
            ? `${
                v.key.isValueAScope ? scopeToTs(v.key.value, 2) : v.key.value
              }${v.key.isOptional ? " | undefined" : ""}`
            : "undefined"
        }, ${
          v.payload.isValueAScope
            ? scopeToTs(v.payload.value, 2)
            : v.payload.value
        }${v.payload.isOptional ? " | undefined" : ""}>("${v.name}"),`;
      })}`;
    }
    default:
      assertUnreachable(b);
      return "";
  }
};

export const codegenTs: (schema: string) => string = (schema) => {
  const blocks = getBlocks(schema);

  const hasCache = blocks.filter((b) => b.type === BlockTypes.cache).length > 0;
  const hasApi = hasCache;

  return []
    .concat(
      hasApi
        ? `import { ${[]
            .concat(hasCache ? ["BaseMemorixApi"] : [])
            .join(", ")} } from "@memorix/client-js";`
        : []
    )
    .concat(blocks.filter((b) => b.type === BlockTypes.model).map(blockToTs))
    .concat(
      hasApi
        ? `export class MemorixApi extends BaseMemorixApi {
${
  hasCache
    ? `    cache = {
${blocks
  .filter((b) => b.type === BlockTypes.cache)
  .map(blockToTs)
  .join("\n\n")}
    }`
    : ""
}
}`
        : []
    )
    .join("\n\n");
};
