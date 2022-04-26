import { BlockCache, BlockModel, BlockTypes, getBlocks } from "./block";
import { Languages, scopeToLanguage } from "./languages";
import { getNamespaces } from "./namespace";
import { removeBracketsOfScope } from "./utilities";

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
            .concat(hasCache ? ["BaseMemorixApi"] : [])
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
        ? `export class MemorixApi extends BaseMemorixApi {
${
  hasCache
    ? `
    cache = {
${blocks
  .filter((b) => b.type === BlockTypes.cache)
  .map(
    (b: BlockCache) =>
      `${getNamespaces(removeBracketsOfScope(b.scope))[0].name}`
  )
  .join("\n\n")}
    }`
    : ""
}
}`
        : []
    )
    .join("\n\n");
};
