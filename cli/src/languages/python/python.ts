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
        ? `MemorixClientCacheOptions(
${getTabs(level + 1)}expire=${
            o.expire
              ? `MemorixClientCacheOptionsExpire(
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
        ? `MemorixClientTaskDequequeOptions(
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
        [BlockTypes.cache]: "MemorixClientCacheApiItem",
        [BlockTypes.pubsub]: "MemorixClientPubSubApiItem",
        [BlockTypes.task]: "MemorixClientTaskApiItem",
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
${getTabs(3)}api=self._api,
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
  return `
${getTabs(1)}config=MemorixClientApi.Config(${
    defaultOptions
      ? `
${getTabs(2)}default_options=MemorixClientApi.Config.DefaultOptions(${
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
${getTabs(2)}),`
      : ""
  }
${getTabs(1)}),
`;
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
) => string = (ns) => {
  const hasCache =
    ns.blocks.filter((b) => b.type === BlockTypes.cache).length > 0;
  const hasPubsub =
    ns.blocks.filter((b) => b.type === BlockTypes.pubsub).length > 0;
  const hasTask =
    ns.blocks.filter((b) => b.type === BlockTypes.task).length > 0;
  const hasApi = ns.defaults || hasCache || hasPubsub || hasTask;

  // const detailedOptions =
  //   options.isApi === true
  //     ? {
  //         export: true,
  //         addPrettierIgnore: !!ns.defaults,
  //         class: "MemorixApi",
  //         classExtend: !ns.defaults
  //           ? "MemorixBaseApi"
  //           : `MemorixBaseApi.withGlobal(${jsonStringify({
  //               defaultOptions: ns.defaults,
  //             })})`,
  //         namespaceNames: options.namespaceNames,
  //       }
  //     : {
  //         export: false,
  //         addPrettierIgnore: true,
  //         class: `Namespace${camelCase(options.name)}`,
  //         classExtend: !ns.defaults
  //           ? `MemorixNamespace.with(${jsonStringify({
  //               name: options.name,
  //             })})`
  //           : `MemorixNamespace.with(${jsonStringify({
  //               name: options.name,
  //               defaultOptions: ns.defaults,
  //             })})`,
  //         namespaceNames: [] as string[],
  //       };

  const code = ([] as string[])
    .concat(
      hasCache
        ? `class MemorixCacheApi(MemorixClientCacheApi):
${getTabs(1)}def __init__(self, api: MemorixClientApi) -> None:
${getTabs(2)}super().__init__(api=api)

${ns.blocks
  .filter((b) => b.type === BlockTypes.cache)
  .map(blockToCode)
  .join("\n")}`
        : []
    )
    .concat(
      hasPubsub
        ? `class MemorixPubSubApi(MemorixClientPubSubApi):
${getTabs(1)}def __init__(self, api: MemorixClientApi) -> None:
${getTabs(2)}super().__init__(api=api)

${ns.blocks
  .filter((b) => b.type === BlockTypes.pubsub)
  .map(blockToCode)
  .join("\n")}`
        : []
    )
    .concat(
      hasTask
        ? `class MemorixTaskApi(MemorixClientTaskApi):
${getTabs(1)}def __init__(self, api: MemorixClientApi) -> None:
${getTabs(2)}super().__init__(api=api)

${ns.blocks
  .filter((b) => b.type === BlockTypes.task)
  .map(blockToCode)
  .join("\n")}`
        : []
    )
    .concat(
      hasApi
        ? `class MemorixApi(${
            ns.defaults
              ? `MemorixClientApi.from_config(  # type: ignore${defaultOptionsToCode(
                  ns.defaults
                )})`
              : "MemorixClientApi"
          }):
${getTabs(1)}def __init__(
${getTabs(2)}self,
${getTabs(2)}redis_url: str,
${getTabs(2)}defaults: typing.Optional[MemorixClientApiDefaults] = None,
${getTabs(1)}) -> None:
${getTabs(2)}super().__init__(redis_url=redis_url, defaults=defaults)

${[]
  .concat(hasCache ? `${getTabs(2)}self.cache = MemorixCacheApi(self)` : [])
  .concat(hasPubsub ? `${getTabs(2)}self.pubsub = MemorixPubSubApi(self)` : [])
  .concat(hasTask ? `${getTabs(2)}self.task = MemorixTaskApi(self)` : [])
  .join("\n")}`
        : []
    )
    .join("\n\n\n");
  return `${code}\n`;
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
  const hasDefaultOptions =
    !!namespaces.global.defaults || namespaces.named.some((x) => x.defaults);
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
  .concat(
    hasApi
      ? [
          `${getTabs(1)}MemorixClientApi`,
          `${getTabs(1)}MemorixClientApiDefaults as _MemorixClientApiDefaults`,
        ]
      : []
  )
  .concat(
    hasCache
      ? [
          `${getTabs(1)}MemorixClientCacheApi`,
          `${getTabs(1)}MemorixClientCacheApiItem`,
          `${getTabs(1)}MemorixClientCacheApiItemNoKey`,
        ]
      : []
  )
  .concat(
    hasCache || hasDefaultOptions
      ? [
          `${getTabs(
            1
          )}MemorixClientCacheOptions as _MemorixClientCacheOptions`,
          `${getTabs(
            1
          )}MemorixClientCacheOptionsExpire as _MemorixClientCacheOptionsExpire`,
        ]
      : []
  )
  .concat(
    hasPubsub
      ? [
          `${getTabs(1)}MemorixClientPubSubApi`,
          `${getTabs(1)}MemorixClientPubSubApiItem`,
          `${getTabs(1)}MemorixClientPubSubApiItemNoKey`,
        ]
      : []
  )
  .concat(
    hasTask
      ? [
          `${getTabs(1)}MemorixClientTaskApi`,
          `${getTabs(1)}MemorixClientTaskApiItem`,
          `${getTabs(1)}MemorixClientTaskApiItemNoKey`,
          `${getTabs(1)}MemorixClientTaskApiItemNoReturns`,
          `${getTabs(1)}MemorixClientTaskApiItemNoKeyNoReturns`,
        ]
      : []
  )
  .concat(
    hasTask || hasDefaultOptions
      ? [
          `${getTabs(
            1
          )}MemorixClientTaskDequequeOptions as _MemorixClientTaskDequequeOptions`,
        ]
      : []
  )
  .join(",\n")},
)`,
    ])
    .concat(
      []
        .concat(
          hasApi ? [`MemorixClientApiDefaults = _MemorixClientApiDefaults`] : []
        )
        .concat(
          hasCache || hasDefaultOptions
            ? [
                `MemorixClientCacheOptions = _MemorixClientCacheOptions`,
                `MemorixClientCacheOptionsExpire = _MemorixClientCacheOptionsExpire`,
              ]
            : []
        )
        .concat(
          hasTask || hasDefaultOptions
            ? [
                `MemorixClientTaskDequequeOptions = _MemorixClientTaskDequequeOptions`,
              ]
            : []
        )
        .join("\n")
    )
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
