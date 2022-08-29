import { Block, BlockTypes, flatBlocks, getBlocks } from "src/block";
import { ValueType, ValueTypes } from "src/value";
import { assertUnreachable, getTabs } from "src/utilities";

const valueToPython: (value: ValueType) => string = (value) => {
  let valuePython;
  if (value.type === ValueTypes.simple) {
    if (value.name === "string") {
      valuePython = "str";
    } else if (value.name === "boolean") {
      valuePython = "bool";
    } else {
      valuePython = `${value.name}`;
    }
  } else if (value.type === ValueTypes.array) {
    valuePython = `typing.List[${valueToPython(value.value)}]`;
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
class ${b.name}:
${b.properties
  .map((p) => `${getTabs(1)}${p.name}: ${valueToPython(p.value)}`)
  .join(`\n`)}`;
    case BlockTypes.enum:
      return `class ${b.name}(Enum):
${b.values.map((v) => `${getTabs(1)}${v} = "${v}"`).join(`\n`)}`;
    case BlockTypes.cache:
    case BlockTypes.pubsub:
    case BlockTypes.task: {
      const itemClass = {
        [BlockTypes.cache]: "MemorixClientCacheApiItem",
        [BlockTypes.pubsub]: "MemorixClientPubsubApiItem",
        [BlockTypes.task]: "MemorixClientTaskApiItem",
      }[b.type];
      const hasReturns = b.type === BlockTypes.task;

      return `${b.values
        .map((v) => {
          return `${getTabs(2)}${v.name} = ${itemClass}(${
            v.key ? `${valueToPython(v.key)}` : "None"
          }, ${valueToPython(v.payload)}${
            hasReturns && "returns" in v
              ? `, ${v.returns ? `${valueToPython(v.returns)}` : "None"}`
              : ""
          }, *args, **kwargs)`;
        })
        .join("\n")}`;
    }
    default:
      assertUnreachable(b);
      return "";
  }
};

export const codegenPython: (schema: string) => string = (schema) => {
  const blocks = flatBlocks(getBlocks(schema));

  const hasEnum = blocks.filter((b) => b.type === BlockTypes.enum).length > 0;
  const hasCache = blocks.filter((b) => b.type === BlockTypes.cache).length > 0;
  const hasPubsub =
    blocks.filter((b) => b.type === BlockTypes.pubsub).length > 0;
  const hasTask = blocks.filter((b) => b.type === BlockTypes.task).length > 0;
  const hasApi = hasCache || hasPubsub || hasTask;

  const code = [
    `import typing${
      hasEnum
        ? `
from enum import Enum`
        : ""
    }
from memorix_client_redis import dataclass${[""]
      .concat(hasApi ? ["MemorixClientApi"] : [])
      .concat(
        hasCache ? ["MemorixClientCacheApi", "MemorixClientCacheApiItem"] : []
      )
      .concat(
        hasPubsub
          ? ["MemorixClientPubsubApi", "MemorixClientPubsubApiItem"]
          : []
      )
      .concat(
        hasTask ? ["MemorixClientTaskApi", "MemorixClientTaskApiItem"] : []
      )
      .join(", ")}`,
  ]
    .concat(blocks.filter((b) => b.type === BlockTypes.enum).map(blockToPython))
    .concat(
      blocks.filter((b) => b.type === BlockTypes.model).map(blockToPython)
    )
    .concat(
      hasCache
        ? `class MemorixCacheApi(MemorixClientCacheApi):
  def __init__(self, *args, **kwargs):
    super(MemorixCacheApi, self).__init__(*args, **kwargs)

${blocks
  .filter((b) => b.type === BlockTypes.cache)
  .map(blockToPython)
  .join("\n")}`
        : []
    )
    .concat(
      hasPubsub
        ? `class MemorixPubsubApi(MemorixClientPubsubApi):
  def __init__(self, *args, **kwargs):
    super(MemorixPubsubApi, self).__init__(*args, **kwargs)

${blocks
  .filter((b) => b.type === BlockTypes.pubsub)
  .map(blockToPython)
  .join("\n")}`
        : []
    )
    .concat(
      hasTask
        ? `class MemorixTaskApi(MemorixClientTaskApi):
  def __init__(self, *args, **kwargs):
    super(MemorixTaskApi, self).__init__(*args, **kwargs)

${blocks
  .filter((b) => b.type === BlockTypes.task)
  .map(blockToPython)
  .join("\n")}`
        : []
    )
    .concat(
      hasApi
        ? `class MemorixApi(MemorixClientApi):
  def __init__(self, *args, **kwargs):
    super(MemorixApi, self).__init__(*args, **kwargs)

${[]
  .concat(
    hasCache ? `${getTabs(2)}cache = MemorixCacheApi(*args, **kwargs)` : []
  )
  .concat(
    hasPubsub ? `${getTabs(2)}pubsub = MemorixPubsubApi(*args, **kwargs)` : []
  )
  .concat(hasTask ? `${getTabs(2)}task = MemorixTaskApi(*args, **kwargs)` : [])
  .join("\n")}`
        : []
    )
    .join("\n\n");
  return `${code}\n`;
};
