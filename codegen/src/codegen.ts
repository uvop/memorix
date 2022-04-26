import { BlockCache, BlockModel, BlockTypes, getBlocks } from "./blocks";
import { Languages, scopeToLanguage } from "./languages";

type CodegenFn = (params: { schema: string; language?: Languages }) => string;

export const codegen: CodegenFn = ({
  schema,
  language = Languages.typescript,
}) => {
  const blocks = getBlocks(schema);

  const hasCache = blocks.filter((b) => b.type === BlockTypes.cache).length > 0;
  const hasApi = hasCache;

  return []
    .concat(
      hasApi
        ? `import { ${[]
            .concat(hasCache ? ["cacheGet", "cacheSet"] : [])
            .join(", ")} } from "@memorix/client-js";`
        : []
    )
    .concat(
      blocks
        .filter((b) => b.type === BlockTypes.model)
        .map(
          (b: BlockModel) =>
            `export interface ${b.name} ${scopeToLanguage(b.scope, language)}`
        )
    )
    .concat(
      hasApi
        ? `export const api = {
${blocks
  .filter((b) => b.type === BlockTypes.cache)
  .map((b: BlockCache) => `${b.type}`)
  .join("\n\n")}
}`
        : []
    )
    .join("\n\n");
};
