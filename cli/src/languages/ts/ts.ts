import { Block, BlockTypes } from "src/core/block";
import { ValueType, ValueTypes } from "src/core/value";
import { assertUnreachable, getTabs } from "src/core/utilities";

export const jsonStringify: (json: any) => string = (json) =>
  JSON.stringify(json, (k, v) => (v === undefined ? null : v))
    .replace(/null/g, "undefined")
    .replace(/"([^"]+)":/g, "$1:");

const valueToTs: (
  value: ValueType,
  level?: number,
  isParentObject?: boolean
) => string = (value, level = 0, isParentObject = false) => {
  let valueTs;

  switch (value.type) {
    case ValueTypes.simple: {
      if (value.name === "int" || value.name === "float") {
        valueTs = "number";
      } else {
        valueTs = `${value.name}`;
      }
      break;
    }
    case ValueTypes.array: {
      valueTs = `Array<${valueToTs(value.value, level)}>`;
      break;
    }
    case ValueTypes.object:
      valueTs = `{
${getTabs(level + 1)}${value.properties
        .map(
          (prop) =>
            `${prop.name}${
              prop.value.type !== ValueTypes.string && prop.value.isOptional
                ? "?"
                : ""
            }: ${valueToTs(prop.value, level + 1, true)};`
        )
        .join(`\n${getTabs(level + 1)}`)}
${getTabs(level)}}`;
      break;
    case ValueTypes.string: {
      throw new Error("Unexpected string value to type generation");
    }
    default: {
      assertUnreachable(value);
      return undefined as any;
    }
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
          return `${
            v.options !== undefined
              ? `${getTabs(2)}// prettier-ignore
`
              : ""
          }${getTabs(2)}${v.name}: this.${itemFn}${v.key ? "" : "NoKey"}<${
            v.key ? `${valueToTs(v.key, 2)}, ` : ""
          }${valueToTs(v.payload, 2)}${
            hasReturns && "returns" in v
              ? `, ${v.returns ? `${valueToTs(v.returns, 2)}` : "undefined"}`
              : ""
          }>("${v.name}"${
            b.type === BlockTypes.task
              ? `, ${v.returns ? "true" : "false"}`
              : ""
          }${v.options !== undefined ? `, ${jsonStringify(v.options)}` : ""}),`;
        })
        .join("\n")}`;
    }
    case BlockTypes.config: {
      const { defaultOptions } = b;
      return `${jsonStringify({ defaultOptions })}`;
    }
    default:
      assertUnreachable(b);
      return "";
  }
};

export const codegenTs: (blocks: Block[]) => string = (blocks) => {
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
        ? `${
            hasConfig
              ? `// prettier-ignore
`
              : ""
          }export class MemorixApi extends ${
            hasConfig
              ? `MemorixClientApi.fromConfig(${blocks
                  .filter((b) => b.type === BlockTypes.config)
                  .map(blockToTs)
                  .join(", ")})`
              : "MemorixClientApi"
          } {
${[]
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
  return `/* eslint-disable */
${code}\n`;
};
