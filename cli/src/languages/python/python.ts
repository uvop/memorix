import {
  Block,
  BlockCache,
  BlockTask,
  BlockTypes,
  DefaultOptions,
  flatBlocks,
} from "src/core/block";
import { ValueType, ValueTypes } from "src/core/value";
import {
  assertUnreachable,
  camelCase,
  getTabs as get2Tabs,
} from "src/core/utilities";
import { Namespace } from "src/core/namespace";

const getTabs = (x: number) => get2Tabs(x * 2);

const blockOptionsToCode: (
  blockType: BlockTypes,
  options: (BlockCache | BlockTask)["values"][number]["options"],
  level: number
) => string = (bType, options, level) => {
  switch (bType) {
    case BlockTypes.cache: {
      const o = options as BlockCache["values"][number]["options"];
      return o
        ? `MemorixCacheItem.Options(
${getTabs(level + 1)}expire=${
            o.expire
              ? `MemorixCacheItem.Options.Expire(
${getTabs(level + 2)}value=${o.expire.value},${
                  o.expire.isInMs !== undefined
                    ? `
${getTabs(level + 2)}is_in_ms=${o.expire.isInMs ? "True" : "False"},`
                    : ""
                }${
                  o.expire.extendOnGet !== undefined
                    ? `
${getTabs(level + 2)}extend_on_get=${o.expire.extendOnGet ? "True" : "False"},`
                    : ""
                }
${getTabs(level + 1)})`
              : "None"
          },
${getTabs(level)})`
        : "None";
    }
    case BlockTypes.task: {
      const o = options as BlockTask["values"][number]["options"];
      return o
        ? `MemorixTaskItem.Options(
${getTabs(level + 1)}take_newest=${o.takeNewest ? "True" : "False"},
${getTabs(level)})`
        : "None";
    }
    case BlockTypes.enum:
    case BlockTypes.pubsub:
    case BlockTypes.model: {
      throw new Error("No options yet");
    }
    default:
      assertUnreachable(bType);
      return "";
  }
};

const valueToCode: (value: ValueType, isType: boolean) => string = (
  value,
  isType
) => {
  let valuePython;
  if (value.type === ValueTypes.simple) {
    if (value.name === "string") {
      valuePython = "str";
    } else if (value.name === "boolean") {
      valuePython = "bool";
    } else if (value.name === "float") {
      valuePython = "float";
    } else if (value.name === "int") {
      valuePython = "int";
    } else if (isType) {
      valuePython = `"${value.name}"`;
    } else {
      valuePython = `${value.name}`;
    }
  } else if (value.type === ValueTypes.array) {
    valuePython = `typing.List[${valueToCode(value.value, isType)}]`;
  } else {
    throw new Error(
      "Shouldn't get here, all inline objects became models, maybe forgot 'flatBlocks()?'"
    );
  }

  return `${value.isOptional ? "typing.Optional[" : ""}${valuePython}${
    value.isOptional ? "]" : ""
  }`;
};

const blockToCode: (block: Block) => string = (b) => {
  switch (b.type) {
    case BlockTypes.model:
      return `@dataclass
class ${b.name}(object):
${b.properties
  .map((p) => `${getTabs(1)}${p.name}: ${valueToCode(p.value, true)}`)
  .join(`\n`)}`;
    case BlockTypes.enum:
      return `class ${b.name}(str, Enum):
${b.values.map((v) => `${getTabs(1)}${v} = "${v}"`).join(`\n`)}`;
    case BlockTypes.cache:
    case BlockTypes.pubsub:
    case BlockTypes.task: {
      const itemClass = {
        [BlockTypes.cache]: "MemorixCacheItem",
        [BlockTypes.pubsub]: "MemorixPubSubItem",
        [BlockTypes.task]: "MemorixTaskItem",
      }[b.type];
      const hasReturns = b.type === BlockTypes.task;

      return `${b.values
        .map((v) => {
          return `${getTabs(2)}self.${v.name} = ${itemClass}${
            v.key ? "" : "NoKey"
          }${hasReturns && !v.returns ? "NoReturns" : ""}[${
            v.key ? `${valueToCode(v.key, true)}, ` : ""
          }${valueToCode(v.payload, true)}${
            v.returns ? `, ${valueToCode(v.returns, true)}` : ""
          }](
${getTabs(3)}api=api,
${getTabs(3)}id="${v.name}",
${getTabs(3)}payload_class=${valueToCode(v.payload, false)},${
            v.returns
              ? `\n${getTabs(3)}returns_class=${valueToCode(v.returns, false)},`
              : ""
          }${
            v.options !== undefined
              ? `
${getTabs(3)}options=${blockOptionsToCode(b.type, v.options, 3)},`
              : ""
          }
${getTabs(2)})`;
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
  return `MemorixBase.DefaultOptions(${
    defaultOptions.cache
      ? `
${getTabs(3)}cache=${blockOptionsToCode(
          BlockTypes.cache,
          defaultOptions.cache,
          3
        )},`
      : ""
  }${
    defaultOptions.task
      ? `
${getTabs(3)}task=${blockOptionsToCode(
          BlockTypes.task,
          defaultOptions.task,
          3
        )},`
      : ""
  }
${getTabs(2)})`;
};

const namespaceToCode: (
  namespace: Namespace,
  nameTree?: string[]
) => {
  code: string;
  importBase: boolean;
  importCache: boolean;
  importPubSub: boolean;
  importTask: boolean;
  importEnum: boolean;
} = (namespace, nameTree = []) => {
  const blocks = flatBlocks(namespace.blocks);
  const hasEnum = blocks.filter((b) => b.type === BlockTypes.enum).length > 0;
  const hasCache = blocks.filter((b) => b.type === BlockTypes.cache).length > 0;
  const hasPubsub =
    blocks.filter((b) => b.type === BlockTypes.pubsub).length > 0;
  const hasTask = blocks.filter((b) => b.type === BlockTypes.task).length > 0;
  const hasApi = hasCache || hasPubsub || hasTask || !!namespace.defaultOptions;

  const subSamespaces = Array.from(namespace.subNamespacesByName.keys()).map(
    (name) =>
      namespaceToCode(namespace.subNamespacesByName.get(name)!, [
        ...nameTree,
        name,
      ])
  );
  const nameCamel = nameTree.map((x) => camelCase(x)).join("");

  const code = ([] as string[])
    .concat(blocks.filter((b) => b.type === BlockTypes.enum).map(blockToCode))
    .concat(blocks.filter((b) => b.type === BlockTypes.model).map(blockToCode))
    .concat(subSamespaces.map((x) => x.code))
    .concat(
      hasCache
        ? `class MemorixCache${nameCamel}(MemorixCacheBase):
${getTabs(1)}def __init__(self, api: MemorixBase) -> None:
${getTabs(2)}super().__init__(api=api)

${blocks
  .filter((b) => b.type === BlockTypes.cache)
  .map(blockToCode)
  .join("\n")}`
        : []
    )
    .concat(
      hasPubsub
        ? `class MemorixPubSub${nameCamel}(MemorixPubSubBase):
${getTabs(1)}def __init__(self, api: MemorixBase) -> None:
${getTabs(2)}super().__init__(api=api)

${blocks
  .filter((b) => b.type === BlockTypes.pubsub)
  .map(blockToCode)
  .join("\n")}`
        : []
    )
    .concat(
      hasTask
        ? `class MemorixTask${nameCamel}(MemorixTaskBase):
${getTabs(1)}def __init__(self, api: MemorixBase) -> None:
${getTabs(2)}super().__init__(api=api)

${blocks
  .filter((b) => b.type === BlockTypes.task)
  .map(blockToCode)
  .join("\n")}`
        : []
    )
    .concat(
      hasApi
        ? `class Memorix${nameCamel}(MemorixBase):
${getTabs(1)}def __init__(
${getTabs(2)}self,
${getTabs(2)}redis_url: str,
${getTabs(2)}ref: typing.Optional[MemorixBase] = None,
${getTabs(1)}) -> None:
${getTabs(2)}super().__init__(redis_url=redis_url, ref=ref)

${getTabs(2)}self._namespace_name_tree = [${nameTree
            .map((x) => `"${x}"`)
            .join(", ")}]${
            namespace.defaultOptions
              ? `
${getTabs(2)}self._default_options = ${defaultOptionsToCode(
                  namespace.defaultOptions
                )}`
              : ""
          }


${Array.from(namespace.subNamespacesByName.keys()).map(
  (namespaceName) =>
    `${getTabs(2)}self.${namespaceName} = Memorix${nameCamel}${camelCase(
      namespaceName
    )}(redis_url=redis_url, ref=self)`
)}${
            Array.from(namespace.subNamespacesByName.keys()).length !== 0
              ? "\n\n"
              : ""
          }${([] as string[])
            .concat(
              hasCache
                ? `${getTabs(2)}self.cache = MemorixCache${nameCamel}(self)`
                : []
            )
            .concat(
              hasPubsub
                ? `${getTabs(2)}self.pubsub = MemorixPubSub${nameCamel}(self)`
                : []
            )
            .concat(
              hasTask
                ? `${getTabs(2)}self.task = MemorixTask${nameCamel}(self)`
                : []
            )
            .join("\n")}`
        : []
    )
    .join("\n\n\n");

  return {
    code: `${code}\n`,
    importBase: hasApi || subSamespaces.some((x) => x.importBase),
    importEnum: hasEnum || subSamespaces.some((x) => x.importEnum),
    importCache: hasCache || subSamespaces.some((x) => x.importCache),
    importPubSub: hasPubsub || subSamespaces.some((x) => x.importPubSub),
    importTask: hasTask || subSamespaces.some((x) => x.importTask),
  };
};

export const codegen: (namespaces: Namespace) => string = (namespace) => {
  const {
    code,
    importBase,
    importEnum,
    importCache,
    importPubSub,
    importTask,
  } = namespaceToCode(namespace);

  const importCode = ([] as string[])
    .concat([
      `# flake8: noqa
import typing

if typing.TYPE_CHECKING:
${getTabs(1)}from dataclasses import dataclass
else:
${getTabs(1)}from memorix_client_redis import dataclass
${
  importEnum
    ? `
from enum import Enum`
    : ""
}
from memorix_client_redis import (
${([] as string[])
  .concat(importBase ? [`${getTabs(1)}MemorixBase`] : [])
  .concat(
    importCache
      ? [
          `${getTabs(1)}MemorixCacheBase`,
          `${getTabs(1)}MemorixCacheItem`,
          `${getTabs(1)}MemorixCacheItemNoKey`,
        ]
      : []
  )
  .concat(
    importPubSub
      ? [
          `${getTabs(1)}MemorixPubSubBase`,
          `${getTabs(1)}MemorixPubSubItem`,
          `${getTabs(1)}MemorixPubSubItemNoKey`,
        ]
      : []
  )
  .concat(
    importTask
      ? [
          `${getTabs(1)}MemorixTaskBase`,
          `${getTabs(1)}MemorixTaskItem`,
          `${getTabs(1)}MemorixTaskItemNoKey`,
          `${getTabs(1)}MemorixTaskItemNoReturns`,
          `${getTabs(1)}MemorixTaskItemNoKeyNoReturns`,
        ]
      : []
  )
  .join(",\n")},
)`,
    ])
    .join("\n");
  return `${importCode}

${code}`;
};
