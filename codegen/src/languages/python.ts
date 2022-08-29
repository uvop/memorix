import { Block, BlockTypes, flatBlocks, getBlocks } from "src/block";
import { ValueType, ValueTypes } from "src/value";
import { assertUnreachable, getTabs } from "src/utilities";

const valueToPython: (value: ValueType) => string = (value) => {
  let valuePython;
  if (value.type === ValueTypes.simple) {
    if (value.name === "string") {
      valuePython = "str";
    } else {
      valuePython = `${value.name}`;
    }
  } else if (value.type === ValueTypes.array) {
    valuePython = `list[${valueToPython(value.value)}]`;
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
      const itemFn = {
        [BlockTypes.cache]: "getCacheItem",
        [BlockTypes.pubsub]: "getPubsubItem",
        [BlockTypes.task]: "getTaskItem",
      }[b.type];
      const hasReturns = b.type === BlockTypes.task;

      return `${b.values
        .map((v) => {
          return `${getTabs(2)}${v.name}: this.${itemFn}<${
            v.key ? `${valueToPython(v.key)}` : "undefined"
          }, ${valueToPython(v.payload)}${
            hasReturns && "returns" in v
              ? `, ${v.returns ? `${valueToPython(v.returns)}` : "undefined"}`
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

export const codegenPython: (schema: string) => string = (schema) => {
  const blocks = flatBlocks(getBlocks(schema));

  const hasCache = blocks.filter((b) => b.type === BlockTypes.cache).length > 0;
  const hasPubsub =
    blocks.filter((b) => b.type === BlockTypes.pubsub).length > 0;
  const hasTask = blocks.filter((b) => b.type === BlockTypes.task).length > 0;
  const hasApi = hasCache || hasPubsub || hasTask;

  const code = [
    `import typing
from memorix_client_redis import dataclass${[""]
      .concat(hasApi ? ["MemorixClientApi"] : [])
      .join(", ")}`,
  ]
    .concat(blocks.filter((b) => b.type === BlockTypes.enum).map(blockToPython))
    .concat(
      blocks.filter((b) => b.type === BlockTypes.model).map(blockToPython)
    )
    .concat(
      hasApi
        ? `class MemorixApi(MemorixClientApi):
${
  hasCache
    ? `${getTabs(1)}cache = {
${blocks
  .filter((b) => b.type === BlockTypes.cache)
  .map(blockToPython)
  .join("\n")}
${getTabs(1)}};`
    : ""
}${
            hasPubsub
              ? `${hasCache ? "\n" : ""}${getTabs(1)}pubsub = {
${blocks
  .filter((b) => b.type === BlockTypes.pubsub)
  .map(blockToPython)
  .join("\n")}
${getTabs(1)}};`
              : ""
          }${
            hasTask
              ? `${hasCache || hasPubsub ? "\n" : ""}${getTabs(1)}task = {
${blocks
  .filter((b) => b.type === BlockTypes.task)
  .map(blockToPython)
  .join("\n")}
${getTabs(1)}};`
              : ""
          }
`
        : []
    )
    .join("\n\n");
  return `${code}\n`;
};
