import { Block, BlockCache, BlockTask, BlockTypes } from "src/core/block";
import { ValueType, ValueTypes } from "src/core/value";
import { assertUnreachable, camelCase, getTabs } from "src/core/utilities";
import { Namespace } from "src/core/namespace";
import { MapValue } from "src/core/generics";

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

      return `${Array.from(b.values.keys())
        .map((name) => {
          const v = b.values.get(name)!;
          return `${
            (
              v as
                | MapValue<BlockCache["values"]>
                | MapValue<BlockTask["values"]>
            ).options !== undefined
              ? `${getTabs(2)}// prettier-ignore
`
              : ""
          }${getTabs(2)}${name}: this.${itemFn}${v.key ? "" : "NoKey"}<${
            v.key ? `${valueToCode(v.key, 2)}, ` : ""
          }${valueToCode(v.payload, 2)}${
            hasReturns
              ? `, ${
                  (v as MapValue<BlockTask["values"]>).returns
                    ? `${valueToCode(
                        (v as MapValue<BlockTask["values"]>).returns!,
                        2
                      )}`
                    : "undefined"
                }`
              : ""
          }>("${name}"${
            hasReturns
              ? `, ${
                  (v as MapValue<BlockTask["values"]>).returns
                    ? "true"
                    : "false"
                }`
              : ""
          }${
            (
              v as
                | MapValue<BlockCache["values"]>
                | MapValue<BlockTask["values"]>
            ).options !== undefined
              ? `, ${jsonStringify(
                  (
                    v as
                      | MapValue<BlockCache["values"]>
                      | MapValue<BlockTask["values"]>
                  ).options!
                )}`
              : ""
          }),`;
        })
        .join("\n")}`;
    }
    default:
      assertUnreachable(b);
      return "";
  }
};

const namespaceToCode: (
  namespace: Namespace,
  nameTree?: string[]
) => { code: string; importBase: boolean } = (namespace, nameTree = []) => {
  const hasCache = !!namespace.cache;
  const hasPubsub = !!namespace.pubsub;
  const hasTask = !!namespace.task;

  const subSamespaces = Array.from(namespace.subNamespacesByName.keys()).map(
    (name) =>
      namespaceToCode(namespace.subNamespacesByName.get(name)!, [
        ...nameTree,
        name,
      ])
  );

  const nameCamel = nameTree.map((x) => camelCase(x)).join("");

  const hasApi =
    hasCache ||
    hasPubsub ||
    hasTask ||
    !!namespace.defaultOptions ||
    subSamespaces.some((x) => x.importBase);

  const code = ([] as string[])
    .concat(subSamespaces.map((x) => x.code))
    .concat(Array.from(namespace.enums.values()).map(blockToCode))
    .concat(Array.from(namespace.models.values()).map(blockToCode))
    .concat(
      hasApi
        ? `${
            nameTree.length === 0 ? "export " : ""
          }class Memorix${nameCamel} extends MemorixBase {
${getTabs(1)}protected namespaceNameTree = [${nameTree
            .map((x) => `"${x}"`)
            .join(", ")}];

${([] as string[])
  .concat(
    namespace.defaultOptions
      ? `${getTabs(1)}// prettier-ignore
${getTabs(1)}protected defaultOptions = ${jsonStringify(
          namespace.defaultOptions
        )};
`
      : []
  )
  .concat(
    Array.from(namespace.subNamespacesByName.keys()).map(
      (namespaceName) =>
        `${getTabs(
          1
        )}${namespaceName} = this.getNamespaceItem(Memorix${nameCamel}${camelCase(
          namespaceName
        )});`
    )
  )
  .concat(
    Array.from(namespace.subNamespacesByName.keys()).length !== 0 &&
      (hasCache || hasPubsub || hasTask)
      ? [""]
      : []
  )
  .concat(
    hasCache
      ? `${getTabs(1)}cache = {
${blockToCode(namespace.cache!)}
${getTabs(1)}};`
      : []
  )
  .concat(
    hasPubsub
      ? `${hasCache ? "\n" : ""}${getTabs(1)}pubsub = {
${blockToCode(namespace.pubsub!)}
${getTabs(1)}};`
      : []
  )
  .concat(
    hasTask
      ? `${hasCache || hasPubsub ? "\n" : ""}${getTabs(1)}task = {
${blockToCode(namespace.task!)}
${getTabs(1)}};`
      : []
  )
  .join("\n")}
}`
        : []
    )
    .join("\n\n");

  return {
    code,
    importBase: hasApi || subSamespaces.some((x) => x.importBase),
  };
};

export const codegen: (namespaces: Namespace) => string = (namespace) => {
  const { code, importBase } = namespaceToCode(namespace);
  return `/* eslint-disable */
${
  importBase
    ? `import { MemorixBase } from "@memorix/client-redis";

`
    : ""
}${code}
`;
};
