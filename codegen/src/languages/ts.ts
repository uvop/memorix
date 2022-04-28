import { Block, BlockTypes, getBlocks } from "src/block";
import { ValueType, ValueTypes } from "src/value";
import { assertUnreachable, getTabs } from "src/utilities";

const valueToTs: (
  value: ValueType,
  level?: number,
  isParentObject?: boolean
) => string = (value, level = 0, isParentObject = false) => {
  let valueTs;
  if (value.type === ValueTypes.simple) {
    valueTs = `${value.name}`;
  } else if (value.type === ValueTypes.array) {
    valueTs = `Array<${valueToTs(value.value, level)}>`;
  } else {
    valueTs = `{
${getTabs(level + 1)}${value.properties
      .map(
        (prop) =>
          `${prop.name}${prop.value.isOptional ? "?" : ""}: ${valueToTs(
            prop.value,
            level + 1,
            true
          )};`
      )
      .join(`\n${getTabs(level + 1)}`)}
${getTabs(level)}}`;
  }

  return `${valueTs}${
    value.isOptional && !isParentObject ? " | undefined" : ""
  }`;
};

const blockToTs: (block: Block) => string = (b) => {
  switch (b.type) {
    case BlockTypes.model:
      return `export type ${b.name} = ${valueToTs({
        type: ValueTypes.object,
        isOptional: false,
        properties: b.properties,
      })};`;
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
            v.key ? `${valueToTs(v.key, 2)}` : "undefined"
          }, ${valueToTs(v.payload, 2)}${
            hasReturns
              ? `, ${v.returns ? `${valueToTs(v.returns, 2)}` : "undefined"}`
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
