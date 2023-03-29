import {
  Block,
  BlockCache,
  BlockTask,
  BlockTypes,
  flatBlocks,
  getBlocks,
} from "src/core/block";
import { ValueType, ValueTypes } from "src/core/value";
import { assertUnreachable, getTabs as get2Tabs } from "src/core/utilities";

const getTabs = (x: number) => get2Tabs(x * 2);

const blockOptionsToPython: (
  blockType: BlockTypes,
  options: (BlockCache | BlockTask)["values"][number]["options"],
  level: number
) => string = (bType, options, level) => {
  switch (bType) {
    case BlockTypes.cache: {
      const o = options as BlockCache["values"][number]["options"];
      return o
        ? `MemorixClientCacheSetOptions(
${getTabs(level + 1)}expire=${
            o.expire
              ? `MemorixClientCacheSetOptionsExpire(
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
    case BlockTypes.model:
    case BlockTypes.config: {
      throw new Error("No options yet");
    }
    default:
      assertUnreachable(bType);
      return "";
  }
};

const valueToPython: (value: ValueType, isType: boolean) => string = (
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
    valuePython = `typing.List[${valueToPython(value.value, isType)}]`;
  } else {
    throw new Error(
      "Shouldn't get here, all inline objects became models, maybe forgot 'flatBlocks()?'"
    );
  }

  return `${value.isOptional ? "typing.Optional[" : ""}${valuePython}${
    value.isOptional ? "]" : ""
  }`;
};

const blockToPython: (block: Block) => string = (b) => {
  switch (b.type) {
    case BlockTypes.model:
      return `@dataclass
class ${b.name}(object):
${b.properties
  .map((p) => `${getTabs(1)}${p.name}: ${valueToPython(p.value, true)}`)
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
            v.key ? `${valueToPython(v.key, true)}, ` : ""
          }${valueToPython(v.payload, true)}${
            v.returns ? `, ${valueToPython(v.returns, true)}` : ""
          }](
${getTabs(3)}api=self._api,
${getTabs(3)}id="${v.name}",
${getTabs(3)}payload_class=${valueToPython(v.payload, false)},${
            v.returns
              ? `\n${getTabs(3)}returns_class=${valueToPython(
                  v.returns,
                  false
                )},`
              : ""
          }${
            v.options !== undefined
              ? `
${getTabs(3)}options=${blockOptionsToPython(b.type, v.options, 3)},`
              : ""
          }
${getTabs(2)})`;
        })
        .join("\n")}`;
    }
    case BlockTypes.config: {
      return `
${getTabs(1)}config=MemorixClientApi.Config(${
        b.defaultOptions
          ? `
${getTabs(2)}default_options=MemorixClientApi.Config.DefaultOptions(${
              b.defaultOptions.cache
                ? `
${getTabs(3)}cache=${blockOptionsToPython(
                    BlockTypes.cache,
                    b.defaultOptions.cache,
                    3
                  )},`
                : ""
            }${
              b.defaultOptions.task
                ? `
${getTabs(3)}task=${blockOptionsToPython(
                    BlockTypes.task,
                    b.defaultOptions.task,
                    3
                  )},`
                : ""
            }
${getTabs(2)}),`
          : ""
      }
${getTabs(1)}),
`;
    }
    default:
      assertUnreachable(b);
      return "";
  }
};

export const codegenPython: (schema: string) => string = (schema) => {
  const blocks = flatBlocks(getBlocks(schema));

  const hasConfig =
    blocks.filter((b) => b.type === BlockTypes.config).length > 0;
  const hasEnum = blocks.filter((b) => b.type === BlockTypes.enum).length > 0;
  const hasCache = blocks.filter((b) => b.type === BlockTypes.cache).length > 0;
  const hasPubsub =
    blocks.filter((b) => b.type === BlockTypes.pubsub).length > 0;
  const hasTask = blocks.filter((b) => b.type === BlockTypes.task).length > 0;
  const hasApi = hasConfig || hasCache || hasPubsub || hasTask;

  const code = [
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
    hasCache || hasConfig
      ? [
          `${getTabs(
            1
          )}MemorixClientCacheSetOptions as _MemorixClientCacheSetOptions`,
          `${getTabs(
            1
          )}MemorixClientCacheSetOptionsExpire as _MemorixClientCacheSetOptionsExpire`,
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
    hasTask || hasConfig
      ? [
          `${getTabs(
            1
          )}MemorixClientTaskDequequeOptions as _MemorixClientTaskDequequeOptions`,
        ]
      : []
  )
  .join(",\n")},
)`,
  ]
    .concat(
      []
        .concat(
          hasApi ? [`MemorixClientApiDefaults = _MemorixClientApiDefaults`] : []
        )
        .concat(
          hasCache || hasConfig
            ? [
                `MemorixClientCacheSetOptions = _MemorixClientCacheSetOptions`,
                `MemorixClientCacheSetOptionsExpire = _MemorixClientCacheSetOptionsExpire`,
              ]
            : []
        )
        .concat(
          hasTask || hasConfig
            ? [
                `MemorixClientTaskDequequeOptions = _MemorixClientTaskDequequeOptions`,
              ]
            : []
        )
        .join("\n")
    )
    .concat(blocks.filter((b) => b.type === BlockTypes.enum).map(blockToPython))
    .concat(
      blocks.filter((b) => b.type === BlockTypes.model).map(blockToPython)
    )
    .concat(
      hasCache
        ? `class MemorixCacheApi(MemorixClientCacheApi):
${getTabs(1)}def __init__(self, api: MemorixClientApi) -> None:
${getTabs(2)}super().__init__(api=api)

${blocks
  .filter((b) => b.type === BlockTypes.cache)
  .map(blockToPython)
  .join("\n")}`
        : []
    )
    .concat(
      hasPubsub
        ? `class MemorixPubSubApi(MemorixClientPubSubApi):
${getTabs(1)}def __init__(self, api: MemorixClientApi) -> None:
${getTabs(2)}super().__init__(api=api)

${blocks
  .filter((b) => b.type === BlockTypes.pubsub)
  .map(blockToPython)
  .join("\n")}`
        : []
    )
    .concat(
      hasTask
        ? `class MemorixTaskApi(MemorixClientTaskApi):
${getTabs(1)}def __init__(self, api: MemorixClientApi) -> None:
${getTabs(2)}super().__init__(api=api)

${blocks
  .filter((b) => b.type === BlockTypes.task)
  .map(blockToPython)
  .join("\n")}`
        : []
    )
    .concat(
      hasApi
        ? `class MemorixApi(${
            hasConfig
              ? `MemorixClientApi.from_config(  # type: ignore${blocks
                  .filter((b) => b.type === BlockTypes.config)
                  .map(blockToPython)
                  .join("\n")})`
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
