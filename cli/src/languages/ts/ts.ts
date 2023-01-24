import { Block, BlockTypes, getBlocks } from "src/core/block";
import { ValueType, ValueTypes } from "src/core/value";
import { assertUnreachable, getTabs } from "src/core/utilities";

const valueToTs: (
  value: ValueType,
  level?: number,
  isParentObject?: boolean
) => string = (value, level = 0, isParentObject = false) => {
  let valueTs;
  if (value.type === ValueTypes.simple) {
    if (value.name === "int" || value.name === "float") {
      valueTs = "number";
    } else {
      valueTs = `${value.name}`;
    }
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
          return `${getTabs(2)}${v.name}: this.${itemFn}${
            v.key ? "" : "NoKey"
          }<${v.key ? `${valueToTs(v.key, 2)}, ` : ""}${valueToTs(
            v.payload,
            2
          )}${
            hasReturns && "returns" in v
              ? `, ${v.returns ? `${valueToTs(v.returns, 2)}` : "undefined"}`
              : ""
          }>("${v.name}"${
            b.type === BlockTypes.task
              ? `, ${v.returns ? "true" : "false"}`
              : ""
          }),`;
        })
        .join("\n")}`;
    }
    case BlockTypes.config: {
      // exclude type from config object
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { type: _ununsed, ...otherProps } = b;
      return `${getTabs(2)}const schemaConfig = ${JSON.stringify(
        otherProps
      ).replace(/"([^"]+)":/g, "$1:")};`;
    }
    default:
      assertUnreachable(b);
      return "";
  }
};

export const codegenTs: (schema: string) => string = (schema) => {
  const blocks = getBlocks(schema);

  const hasConfig =
    blocks.filter((b) => b.type === BlockTypes.config).length > 0;
  const hasCache = blocks.filter((b) => b.type === BlockTypes.cache).length > 0;
  const hasPubsub =
    blocks.filter((b) => b.type === BlockTypes.pubsub).length > 0;
  const hasTask = blocks.filter((b) => b.type === BlockTypes.task).length > 0;
  const hasApi = hasCache || hasPubsub || hasTask || hasConfig;

  const code = []
    .concat(
      hasApi
        ? `import { ${([] as string[])
            .concat(hasApi ? ["MemorixClientApi"] : [])
            .join(", ")} } from "@memorix/client-redis";`
        : []
    )
    .concat(blocks.filter((b) => b.type === BlockTypes.enum).map(blockToTs))
    .concat(blocks.filter((b) => b.type === BlockTypes.model).map(blockToTs))
    .concat(
      hasApi
        ? `export class MemorixApi extends MemorixClientApi {
${[]
  .concat(
    hasConfig
      ? `${getTabs(1)}constructor(options) {
${blocks
  .filter((b) => b.type === BlockTypes.config)
  .map(blockToTs)
  .join("\n")}
${getTabs(2)}super({ ...schemaConfig, ...options });
${getTabs(1)}};`
      : []
  )
  .concat(
    hasCache
      ? `${getTabs(1)}cache = {
${blocks
  .filter((b) => b.type === BlockTypes.cache)
  .map(blockToTs)
  .join("\n")}
${getTabs(1)}};`
      : []
  )
  .concat(
    hasPubsub
      ? `${hasCache ? "\n" : ""}${getTabs(1)}pubsub = {
${blocks
  .filter((b) => b.type === BlockTypes.pubsub)
  .map(blockToTs)
  .join("\n")}
${getTabs(1)}};`
      : []
  )
  .concat(
    hasTask
      ? `${hasCache || hasPubsub ? "\n" : ""}${getTabs(1)}task = {
${blocks
  .filter((b) => b.type === BlockTypes.task)
  .map(blockToTs)
  .join("\n")}
${getTabs(1)}};`
      : []
  )
  .join("\n")}
}`
        : []
    )
    .join("\n\n");
  return `${code}\n`;
};
