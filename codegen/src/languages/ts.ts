import { Block, BlockTypes, getBlocks } from "src/block";
import { getProperties } from "src/property";
import {
  assertUnreachable,
  getTabs,
  removeBracketsOfScope,
} from "src/utilities";

const scopeToTs: (scope: string, level?: number) => string = (
  scope,
  level = 0
) => {
  const properties = getProperties(removeBracketsOfScope(scope));

  return `{
${getTabs(level + 1)}${properties
    .map(
      (prop) =>
        `${prop.name}${prop.isOptional ? "?" : ""}: ${
          prop.isValueAScope ? scopeToTs(prop.value, level + 1) : prop.value
        };`
    )
    .join(`\n${getTabs(level + 1)}`)}
${getTabs(level)}}`;
};

const blockToTs: (block: Block) => string = (b) => {
  switch (b.type) {
    case BlockTypes.model:
      return `export type ${b.name} = ${scopeToTs(b.scope)};`;
    case BlockTypes.cache:
    case BlockTypes.pubsub:
    case BlockTypes.task: {
      const itemFn = {
        [BlockTypes.cache]: "getCacheItem",
        [BlockTypes.pubsub]: "getPubsubItem",
        [BlockTypes.task]: "getTaskItem",
      }[b.type];
      const hasReturns = b.type === BlockTypes.task;

      return `${b.values
        .map((v) => {
          return `${getTabs(2)}${v.name}: this.${itemFn}<${
            v.key
              ? `${
                  v.key.isValueAScope ? scopeToTs(v.key.value, 2) : v.key.value
                }${v.key.isOptional ? " | undefined" : ""}`
              : "never"
          }, ${
            v.payload.isValueAScope
              ? scopeToTs(v.payload.value, 2)
              : v.payload.value
          }${v.payload.isOptional ? " | undefined" : ""}${
            hasReturns
              ? `, ${
                  v.returns
                    ? `${
                        v.returns.isValueAScope
                          ? scopeToTs(v.returns.value, 2)
                          : v.returns.value
                      }${v.returns.isOptional ? " | undefined" : ""}`
                    : "never"
                }`
              : ""
          }>("${v.name}"),`;
        })
        .join("\n")}`;
    }
    default:
      assertUnreachable(b);
      return "";
  }
};

export const codegenTs: (schema: string) => string = (schema) => {
  const blocks = getBlocks(schema);

  const hasCache = blocks.filter((b) => b.type === BlockTypes.cache).length > 0;
  const hasPubsub =
    blocks.filter((b) => b.type === BlockTypes.pubsub).length > 0;
  const hasTask = blocks.filter((b) => b.type === BlockTypes.task).length > 0;
  const hasApi = hasCache || hasPubsub || hasTask;

  const code = []
    .concat(
      hasApi
        ? `import { ${[]
            .concat(hasApi ? ["BaseMemorixApi"] : [])
            .join(", ")} } from "@memorix/client-js";`
        : []
    )
    .concat(blocks.filter((b) => b.type === BlockTypes.model).map(blockToTs))
    .concat(
      hasApi
        ? `export class MemorixApi extends BaseMemorixApi {
${
  hasCache
    ? `${getTabs(1)}cache = {
${blocks
  .filter((b) => b.type === BlockTypes.cache)
  .map(blockToTs)
  .join("\n\n")}
${getTabs(1)}};`
    : ""
}${
            hasPubsub
              ? `${hasCache ? "\n" : ""}${getTabs(1)}pubsub = {
${blocks
  .filter((b) => b.type === BlockTypes.pubsub)
  .map(blockToTs)
  .join("\n\n")}
${getTabs(1)}};`
              : ""
          }${
            hasTask
              ? `${hasCache || hasPubsub ? "\n" : ""}${getTabs(1)}task = {
${blocks
  .filter((b) => b.type === BlockTypes.task)
  .map(blockToTs)
  .join("\n\n")}
${getTabs(1)}};`
              : ""
          }
}`
        : []
    )
    .join("\n\n");
  return `${code}\n`;
};
