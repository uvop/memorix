import { Block, BlockTypes, getBlocks } from "src/block";
import { PropertyType } from "src/property";
import { assertUnreachable, getTabs } from "src/utilities";

const valueToTs: (value: string | PropertyType[], level?: number) => string = (
  value,
  level = 0
) => {
  if (typeof value === "string") {
    return value;
  }

  return `{
${getTabs(level + 1)}${value
    .map(
      (prop) =>
        `${prop.name}${prop.isOptional ? "?" : ""}: ${valueToTs(
          prop.value,
          level + 1
        )};`
    )
    .join(`\n${getTabs(level + 1)}`)}
${getTabs(level)}}`;
};

const blockToTs: (block: Block) => string = (b) => {
  switch (b.type) {
    case BlockTypes.model:
      return `export type ${b.name} = ${valueToTs(b.properties)};`;
    case BlockTypes.enum:
      return `export enum ${b.name} {
${b.values.map((v) => `${getTabs(1)}${v} = "${v}",`).join(`\n`)}
}`;
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
              ? `${valueToTs(v.key.value, 2)}${
                  v.key.isOptional ? " | undefined" : ""
                }`
              : "never"
          }, ${valueToTs(v.payload.value, 2)}${
            v.payload.isOptional ? " | undefined" : ""
          }${
            hasReturns
              ? `, ${
                  v.returns
                    ? `${valueToTs(v.returns.value, 2)}${
                        v.returns.isOptional ? " | undefined" : ""
                      }`
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
    .concat(blocks.filter((b) => b.type === BlockTypes.enum).map(blockToTs))
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
  .join("\n")}
${getTabs(1)}};`
    : ""
}${
            hasPubsub
              ? `${hasCache ? "\n" : ""}${getTabs(1)}pubsub = {
${blocks
  .filter((b) => b.type === BlockTypes.pubsub)
  .map(blockToTs)
  .join("\n")}
${getTabs(1)}};`
              : ""
          }${
            hasTask
              ? `${hasCache || hasPubsub ? "\n" : ""}${getTabs(1)}task = {
${blocks
  .filter((b) => b.type === BlockTypes.task)
  .map(blockToTs)
  .join("\n")}
${getTabs(1)}};`
              : ""
          }
}`
        : []
    )
    .join("\n\n");
  return `${code}\n`;
};
