import {
  Block,
  BlockCache,
  BlockTask,
  BlockTypes,
  DefaultOptions,
  Namespace,
  Namespaces,
  flatNamespaces,
} from "src/core/block";
import { ValueType, ValueTypes } from "src/core/value";
import {
  assertUnreachable,
  camelCase,
  // camelCase,
  getTabs as get2Tabs,
} from "src/core/utilities";

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
  return `${getTabs(
    2
  )}default_options=MemorixBaseApi.BaseApiWithGlobalData.DefaultOptions(${
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
${getTabs(2)}),`;
};

const namespaceToCode: (
  ns: Namespace,
  options:
    | {
        isApi: true;
        namespaceNames: string[];
      }
    | {
        isApi: false;
        name: string;
      }
) => string = (ns, options) => {
  const hasCache =
    ns.blocks.filter((b) => b.type === BlockTypes.cache).length > 0;
  const hasPubsub =
    ns.blocks.filter((b) => b.type === BlockTypes.pubsub).length > 0;
  const hasTask =
    ns.blocks.filter((b) => b.type === BlockTypes.task).length > 0;
  const hasApi = ns.defaults || hasCache || hasPubsub || hasTask;

  const detailedOptions =
    options.isApi === true
      ? {
          cacheName: "MemorixCacheApi",
          pubsubName: "MemorixPubSubApi",
          taskName: "MemorixTaskApi",
          apiName: "MemorixApi",
          apiExtends: ns.defaults
            ? `MemorixBaseApi.with_global_data(  # type: ignore
${getTabs(1)}data=MemorixBaseApi.BaseApiWithGlobalData(
${defaultOptionsToCode(ns.defaults)}
${getTabs(1)}),
)`
            : "MemorixBaseApi",
          namespaceNames: options.namespaceNames,
          apiInit: `${getTabs(1)}def __init__(
${getTabs(2)}self,
${getTabs(2)}redis_url: str,
${getTabs(1)}) -> None:
${getTabs(2)}super().__init__(redis_url=redis_url)`,
        }
      : {
          cacheName: `Memorix${camelCase(options.name)}CacheApi`,
          pubsubName: `Memorix${camelCase(options.name)}PubSubApi`,
          taskName: `Memorix${camelCase(options.name)}TaskApi`,
          apiName: `Memorix${camelCase(options.name)}Namespace`,
          apiExtends: ns.defaults
            ? `MemorixNamespace.with_data(  # type: ignore
${getTabs(1)}data=MemorixNamespace.NamespaceApiWithData(
${getTabs(2)}name="${options.name}",
${defaultOptionsToCode(ns.defaults)}
${getTabs(1)}),
)`
            : "MemorixNamespace",
          apiInit: `${getTabs(1)}def __init__(
${getTabs(2)}self,
${getTabs(2)}api: MemorixBaseApi,
${getTabs(1)}) -> None:
${getTabs(2)}super().__init__(connection=api._connection)`,
          namespaceNames: [] as string[],
        };

  const code = ([] as string[])
    .concat(
      hasCache
        ? `class ${detailedOptions.cacheName}(MemorixBaseCacheApi):
${getTabs(1)}def __init__(self, api: MemorixBaseApi) -> None:
${getTabs(2)}super().__init__(api=api)

${ns.blocks
  .filter((b) => b.type === BlockTypes.cache)
  .map(blockToCode)
  .join("\n")}`
        : []
    )
    .concat(
      hasPubsub
        ? `class ${detailedOptions.pubsubName}(MemorixBasePubSubApi):
${getTabs(1)}def __init__(self, api: MemorixBaseApi) -> None:
${getTabs(2)}super().__init__(api=api)

${ns.blocks
  .filter((b) => b.type === BlockTypes.pubsub)
  .map(blockToCode)
  .join("\n")}`
        : []
    )
    .concat(
      hasTask
        ? `class ${detailedOptions.taskName}(MemorixBaseTaskApi):
${getTabs(1)}def __init__(self, api: MemorixBaseApi) -> None:
${getTabs(2)}super().__init__(api=api)

${ns.blocks
  .filter((b) => b.type === BlockTypes.task)
  .map(blockToCode)
  .join("\n")}`
        : []
    )
    .concat(
      hasApi
        ? `class ${detailedOptions.apiName}(${detailedOptions.apiExtends}):
${detailedOptions.apiInit}

${
  detailedOptions.namespaceNames.length > 0
    ? `${detailedOptions.namespaceNames
        .map(
          (x) =>
            `${getTabs(2)}self.${x} = Memorix${camelCase(x)}Namespace(self)`
        )
        .join("\n")}\n\n`
    : ""
}${[]
            .concat(
              hasCache
                ? `${getTabs(2)}self.cache = ${detailedOptions.cacheName}(self)`
                : []
            )
            .concat(
              hasPubsub
                ? `${getTabs(2)}self.pubsub = ${
                    detailedOptions.pubsubName
                  }(self)`
                : []
            )
            .concat(
              hasTask
                ? `${getTabs(2)}self.task = ${detailedOptions.taskName}(self)`
                : []
            )
            .join("\n")}`
        : []
    )
    .join("\n\n\n");
  return `${code}`;
};

export const codegen: (namespaces: Namespaces) => string = (
  nonFlatNamespaces
) => {
  const namespaces = flatNamespaces(nonFlatNamespaces);
  const allBlocks = [
    ...namespaces.global.blocks,
    ...namespaces.named.map((x) => x.blocks).flat(),
  ];
  const hasNamespaces = namespaces.named.length > 0;
  // const hasDefaultOptions =
  //   !!namespaces.global.defaults || namespaces.named.some((x) => x.defaults);
  const hasEnum =
    allBlocks.filter((b) => b.type === BlockTypes.enum).length > 0;
  const hasCache =
    allBlocks.filter((b) => b.type === BlockTypes.cache).length > 0;
  const hasPubsub =
    allBlocks.filter((b) => b.type === BlockTypes.pubsub).length > 0;
  const hasTask =
    allBlocks.filter((b) => b.type === BlockTypes.task).length > 0;
  const hasApi =
    hasCache ||
    hasPubsub ||
    hasTask ||
    hasNamespaces ||
    namespaces.global.defaults;

  const code = ([] as string[])
    .concat([
      `# flake8: noqa
import typing

if typing.TYPE_CHECKING:
${getTabs(1)}from dataclasses import dataclass
else:
${getTabs(1)}from memorix_client_redis import dataclass
${
  hasEnum
    ? `
from enum import Enum`
    : ""
}
from memorix_client_redis import (
${[]
  .concat(hasApi ? [`${getTabs(1)}MemorixBaseApi`] : [])
  .concat(hasNamespaces ? [`${getTabs(1)}MemorixNamespace`] : [])
  .concat(
    hasCache
      ? [
          `${getTabs(1)}MemorixBaseCacheApi`,
          `${getTabs(1)}MemorixCacheItem`,
          `${getTabs(1)}MemorixCacheItemNoKey`,
        ]
      : []
  )
  .concat(
    hasPubsub
      ? [
          `${getTabs(1)}MemorixBasePubSubApi`,
          `${getTabs(1)}MemorixPubSubItem`,
          `${getTabs(1)}MemorixPubSubItemNoKey`,
        ]
      : []
  )
  .concat(
    hasTask
      ? [
          `${getTabs(1)}MemorixBaseTaskApi`,
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
    .concat(
      allBlocks.filter((b) => b.type === BlockTypes.enum).map(blockToCode)
    )
    .concat(
      allBlocks.filter((b) => b.type === BlockTypes.model).map(blockToCode)
    )
    .concat(
      namespaces.named.map((x) =>
        namespaceToCode(x, { isApi: false, name: x.name })
      )
    )
    .concat(
      hasApi
        ? namespaceToCode(namespaces.global, {
            isApi: true,
            namespaceNames: namespaces.named.map((x) => x.name),
          })
        : []
    )
    .join("\n\n\n");

  return `${code}\n`;
};
