import {
  Block,
  BlockTypes,
  DefaultOptions,
  Namespace,
  Namespaces,
} from "src/core/block";
import { ValueType, ValueTypes } from "src/core/value";
import { assertUnreachable, camelCase, getTabs } from "src/core/utilities";

export const jsonStringify: (json: any) => string = (json) =>
  JSON.stringify(json, (k, v) => (v === undefined ? null : v))
    .replace(/null/g, "undefined")
    .replace(/"([^"]+)":/g, "$1:");

const valueToCode: (
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
      valueTs = `Array<${valueToCode(value.value, level)}>`;
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
            }: ${valueToCode(prop.value, level + 1, true)};`
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

const blockToCode: (block: Block) => string = (b) => {
  switch (b.type) {
    case BlockTypes.model:
      return `export type ${b.name} = ${valueToCode({
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
            v.key ? `${valueToCode(v.key, 2)}, ` : ""
          }${valueToCode(v.payload, 2)}${
            hasReturns && "returns" in v
              ? `, ${v.returns ? `${valueToCode(v.returns, 2)}` : "undefined"}`
              : ""
          }>("${v.name}"${
            b.type === BlockTypes.task
              ? `, ${v.returns ? "true" : "false"}`
              : ""
          }${v.options !== undefined ? `, ${jsonStringify(v.options)}` : ""}),`;
        })
        .join("\n")}`;
    }
    default:
      assertUnreachable(b);
      return "";
  }
};

const defaultOptionsToCode: (defaultOptions: DefaultOptions) => string = (
  defaultOptions
) => {
  return `${jsonStringify({ defaultOptions })}`;
};

const namespaceToCode: (name: string, ns: Namespace) => string = (name, ns) => {
  const hasCache =
    ns.blocks.filter((b) => b.type === BlockTypes.cache).length > 0;
  const hasPubsub =
    ns.blocks.filter((b) => b.type === BlockTypes.pubsub).length > 0;
  const hasTask =
    ns.blocks.filter((b) => b.type === BlockTypes.task).length > 0;
  const hasApi = hasCache || hasPubsub || hasTask;

  const code = []
    .concat(
      ns.blocks.filter((b) => b.type === BlockTypes.enum).map(blockToCode)
    )
    .concat(
      ns.blocks.filter((b) => b.type === BlockTypes.model).map(blockToCode)
    )
    .concat(
      hasApi
        ? `${
            ns.defaults
              ? `// prettier-ignore
`
              : ""
          }class Namespace${camelCase(name)} extends ${
            ns.defaults
              ? `MemorixNamespace.withDefaultOptions(${defaultOptionsToCode(
                  ns.defaults
                )})`
              : "MemorixNamespace"
          } {
${[]
  .concat(
    hasCache
      ? `${getTabs(1)}cache = {
${ns.blocks
  .filter((b) => b.type === BlockTypes.cache)
  .map(blockToCode)
  .join("\n")}
${getTabs(1)}};`
      : []
  )
  .concat(
    hasPubsub
      ? `${hasCache ? "\n" : ""}${getTabs(1)}pubsub = {
${ns.blocks
  .filter((b) => b.type === BlockTypes.pubsub)
  .map(blockToCode)
  .join("\n")}
${getTabs(1)}};`
      : []
  )
  .concat(
    hasTask
      ? `${hasCache || hasPubsub ? "\n" : ""}${getTabs(1)}task = {
${ns.blocks
  .filter((b) => b.type === BlockTypes.task)
  .map(blockToCode)
  .join("\n")}
${getTabs(1)}};`
      : []
  )
  .join("\n")}
}`
        : []
    )
    .join("\n\n");

  return `${code}`;
};

export const codegen: (namespaces: Namespaces) => string = (namespaces) => {
  const allBlocks = [
    ...namespaces.global.blocks,
    ...namespaces.named.map((x) => x.blocks).flat(),
  ];
  const hasCache =
    allBlocks.filter((b) => b.type === BlockTypes.cache).length > 0;
  const hasPubsub =
    allBlocks.filter((b) => b.type === BlockTypes.pubsub).length > 0;
  const hasTask =
    allBlocks.filter((b) => b.type === BlockTypes.task).length > 0;
  const hasApi = hasCache || hasPubsub || hasTask || namespaces.global.defaults;

  const code = []
    .concat(
      hasApi
        ? `import { ${([] as string[])
            .concat(hasApi ? ["createMemorixApi", "MemorixNamespace"] : [])
            .join(", ")} } from "@memorix/client-redis";`
        : []
    )
    .concat(
      allBlocks.filter((b) => b.type === BlockTypes.enum).map(blockToCode)
    )
    .concat(
      allBlocks.filter((b) => b.type === BlockTypes.model).map(blockToCode)
    )
    .concat(namespaces.named.map((x) => namespaceToCode(x.name, x)))
    .concat(namespaceToCode("global", namespaces.global))
    .concat(
      hasApi
        ? `${
            namespaces.global.defaults
              ? `// prettier-ignore
`
              : ""
          }export const MemorixApi = createMemorixApi(NamespaceGlobal, {
${namespaces.named
  .map((x) => `${getTabs(1)}${x.name}: Namespace${camelCase(x.name)},`)
  .join("\n")}
});`
        : []
    )
    .join("\n\n");

  return `/* eslint-disable */
${code}\n`;
};
