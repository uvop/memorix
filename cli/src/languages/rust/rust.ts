import {
  Block,
  BlockCache,
  BlockTask,
  BlockTypes,
  DefaultOptions,
} from "src/core/block";
import { ValueType, ValueTypes } from "src/core/value";
import {
  assertUnreachable,
  camelCase,
  getTabs as get2Tabs,
  pascalCase,
} from "src/core/utilities";
import { Namespace, flatNamespace } from "src/core/namespace";
import { MapValue } from "src/core/generics";

const getTabs = (x: number) => get2Tabs(x * 2);

const blockOptionsToCode: (
  blockType: BlockTypes,
  options: MapValue<(BlockCache | BlockTask)["values"]>["options"],
  level: number
) => string = (bType, options, level) => {
  switch (bType) {
    case BlockTypes.cache: {
      const o = options as MapValue<BlockCache["values"]>["options"];
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
      const o = options as MapValue<BlockTask["values"]>["options"];
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
      valuePython = "String";
    } else if (value.name === "boolean") {
      valuePython = "bool";
    } else if (value.name === "float") {
      valuePython = "f32";
    } else if (value.name === "int") {
      valuePython = "i32";
    } else if (isType) {
      valuePython = `${value.name}`;
    } else {
      valuePython = `${value.name}`;
    }
  } else if (value.type === ValueTypes.array) {
    valuePython = `Vec<${valueToCode(value.value, isType)}>`;
  } else {
    throw new Error(
      "Shouldn't get here, all inline objects became models, maybe forgot 'flatBlocks()?'"
    );
  }

  return `${value.isOptional ? "Option<" : ""}${valuePython}${
    value.isOptional ? ">" : ""
  }`;
};

const blockToStruct: (block: Block) => string = (b) => {
  switch (b.type) {
    case BlockTypes.model:
      return `#[derive(serde::Serialize, serde::Deserialize)]
pub struct ${b.name} {
${b.properties
  .map(
    (p) =>
      `${
        (p.value.type === ValueTypes.array ||
          p.value.type === ValueTypes.simple) &&
        p.value.isOptional
          ? `${getTabs(1)}#[serde(skip_serializing_if = "Option::is_none")]\n`
          : ""
      }${getTabs(1)}pub ${p.name}: ${valueToCode(p.value, true)},`
  )
  .join(`\n`)}
}`;
    case BlockTypes.enum:
      return `#[allow(non_camel_case_types, clippy::upper_case_acronyms)]
#[derive(serde::Serialize, serde::Deserialize, PartialEq, std::fmt::Debug)]
pub enum ${b.name} {
${b.values.map((v) => `${getTabs(1)}${v},`).join(`\n`)}
}`;
    case BlockTypes.cache:
    case BlockTypes.pubsub:
    case BlockTypes.task: {
      const itemClass = {
        [BlockTypes.cache]: "MemorixCacheItem",
        [BlockTypes.pubsub]: "MemorixPubSubItem",
        [BlockTypes.task]: "MemorixTaskItem",
      }[b.type];
      const hasReturns = b.type === BlockTypes.task;

      return `${(
        Array.from(b.values.entries()) as [
          string,
          MapValue<typeof b["values"]>
        ][]
      )
        .map(([name, v]) => {
          return `pub ${getTabs(1)}${name}: memorix_redis::${itemClass}${
            v.key ? "" : "NoKey"
          }${
            hasReturns && !(v as MapValue<BlockTask["values"]>).returns
              ? "NoReturns"
              : ""
          }<'a, ${v.key ? `${valueToCode(v.key, true)}, ` : ""}${valueToCode(
            v.payload,
            true
          )}${
            (v as MapValue<BlockTask["values"]>).returns
              ? `, ${valueToCode(
                  (v as MapValue<BlockTask["values"]>).returns!,
                  true
                )}`
              : ""
          }>,`;
        })
        .join("\n")}`;
    }
    default:
      assertUnreachable(b);
      return "";
  }
};
const blockToCode: (block: Block) => string = (b) => {
  switch (b.type) {
    case BlockTypes.model:
      return `#[derive(serde::Serialize, serde::Deserialize)]
pub struct ${b.name} {
${b.properties
  .map(
    (p) =>
      `${
        (p.value.type === ValueTypes.array ||
          p.value.type === ValueTypes.simple) &&
        p.value.isOptional
          ? `${getTabs(1)}#[serde(skip_serializing_if = "Option::is_none")]\n`
          : ""
      }${getTabs(1)}pub ${p.name}: ${valueToCode(p.value, true)},`
  )
  .join(`\n`)}
}`;
    case BlockTypes.enum:
      return `#[allow(non_camel_case_types, clippy::upper_case_acronyms)]
#[derive(serde::Serialize, serde::Deserialize, PartialEq, std::fmt::Debug)]
pub enum ${b.name} {
${b.values.map((v) => `${getTabs(1)}${v},`).join(`\n`)}
}`;
    case BlockTypes.cache:
    case BlockTypes.pubsub:
    case BlockTypes.task: {
      const itemClass = {
        [BlockTypes.cache]: "MemorixCacheItem",
        [BlockTypes.pubsub]: "MemorixPubSubItem",
        [BlockTypes.task]: "MemorixTaskItem",
      }[b.type];
      const hasReturns = b.type === BlockTypes.task;

      return `${(
        Array.from(b.values.entries()) as [
          string,
          MapValue<typeof b["values"]>
        ][]
      )
        .map(([name, v]) => {
          return `${getTabs(3)}${name}: memorix_redis::${itemClass}${
            v.key ? "" : "NoKey"
          }${
            hasReturns && !(v as MapValue<BlockTask["values"]>).returns
              ? "NoReturns"
              : ""
          }::new(
${getTabs(4)}memorix_base.clone(),
${getTabs(4)}"${name}",
${getTabs(3)}),`;
        })
        .join("\n")}`;
    }
    default:
      assertUnreachable(b);
      return "";
  }
};

const defaultOptionsToCode: (defaultOptions?: DefaultOptions) => string = (
  defaultOptions
) => {
  if (!defaultOptions) {
    return "None";
  }
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
  const hasEnum = namespace.enums.size > 0;
  const hasCache = !!namespace.cache;
  const hasPubsub = !!namespace.pubsub;
  const hasTask = !!namespace.task;
  const hasApi = hasCache || hasPubsub || hasTask || !!namespace.defaultOptions;

  const subSamespaces = Array.from(namespace.subNamespacesByName.keys()).map(
    (name) =>
      namespaceToCode(namespace.subNamespacesByName.get(name)!, [
        ...nameTree,
        name,
      ])
  );
  const nameCamel = nameTree.map((x) => camelCase(x)).join("");
  const namePascal = nameTree.map((x) => pascalCase(x)).join("_");

  const code = ([] as string[])
    .concat(Array.from(namespace.enums.values()).map(blockToCode))
    .concat(Array.from(namespace.models.values()).map(blockToCode))
    .concat(subSamespaces.map((x) => x.code))
    .concat(
      hasCache
        ? `#[allow(non_snake_case)]
pub struct MemorixCache${nameCamel}<'a> {
${blockToStruct(namespace.cache!)}
}

impl<'a> MemorixCache${nameCamel}<'a> {
${getTabs(1)}fn new(memorix_base: memorix_redis::MemorixBase) -> Self {
${getTabs(2)}Self {
${blockToCode(namespace.cache!)}
${getTabs(2)}}
${getTabs(1)}}
}`
        : []
    )
    .concat(
      hasPubsub
        ? `#[allow(non_snake_case)]
pub struct MemorixPubSub${nameCamel}<'a> {
${blockToStruct(namespace.pubsub!)}
}

impl<'a> MemorixPubSub${nameCamel}<'a> {
${getTabs(1)}fn new(memorix_base: memorix_redis::MemorixBase) -> Self {
${getTabs(2)}Self {
${blockToCode(namespace.pubsub!)}
${getTabs(2)}}
${getTabs(1)}}
}`
        : []
    )
    .concat(
      hasTask
        ? `#[allow(non_snake_case)]
pub struct MemorixTask${nameCamel}<'a> {
${blockToStruct(namespace.task!)}
}

impl<'a> MemorixTask${nameCamel}<'a> {
${getTabs(1)}fn new(memorix_base: memorix_redis::MemorixBase) -> Self {
${getTabs(2)}Self {
${blockToCode(namespace.task!)}
${getTabs(2)}}
${getTabs(1)}}
}`
        : []
    )
    .concat(
      hasApi || namespace.subNamespacesByName.size !== 0
        ? `pub struct Memorix${nameCamel}<'a> {
${([] as string[])
  .concat(
    hasCache ? `${getTabs(1)}pub cache: MemorixCache${nameCamel}<'a>,` : []
  )
  .concat(
    hasPubsub ? `${getTabs(1)}pub pubsub: MemorixPubSub${nameCamel}<'a>,` : []
  )
  .concat(hasTask ? `${getTabs(1)}pub task: MemorixTask${nameCamel}<'a>,` : [])
  .join("\n")}
}

const MEMORIX_${
            namePascal ? `${namePascal}_` : ""
          }NAMESPACE_NAME_TREE: &'static [&'static str] = &[${nameTree
            .map((x) => `"${x}"`)
            .join(", ")}];

impl<'a> Memorix${nameCamel}<'a> {
${getTabs(1)}pub async fn new(redis_url: &str) -> Memorix<'a> {
${getTabs(2)}let memorix_base = memorix_redis::MemorixBase::new(
${getTabs(3)}redis_url,
${getTabs(3)}MEMORIX_${namePascal ? `${namePascal}_` : ""}NAMESPACE_NAME_TREE,
${getTabs(3)}${defaultOptionsToCode(namespace.defaultOptions)}
${getTabs(2)}).await;
${getTabs(2)}Self {
${([] as string[])
  .concat(
    hasCache
      ? `${getTabs(
          3
        )}cache: MemorixCache${nameCamel}::new(memorix_base.clone()),`
      : []
  )
  .concat(
    hasPubsub
      ? `${getTabs(
          3
        )}pubsub: MemorixPubSub${nameCamel}::new(memorix_base.clone()),`
      : []
  )
  .concat(
    hasTask
      ? `${getTabs(3)}task: MemorixTask${nameCamel}::new(memorix_base.clone()),`
      : []
  )
  .join("\n")}
${getTabs(2)}}
${getTabs(1)}}
}

${Array.from(namespace.subNamespacesByName.keys())
  .map(
    (namespaceName) =>
      `${getTabs(2)}self.${namespaceName} = Memorix${nameCamel}${camelCase(
        namespaceName
      )}(redis_url=redis_url, ref=self)`
  )
  .join("\n")}${
            Array.from(namespace.subNamespacesByName.keys()).length !== 0
              ? "\n\n"
              : ""
          }`
        : []
    )
    .join("\n\n\n");

  return {
    code,
    importBase: hasApi || subSamespaces.some((x) => x.importBase),
    importEnum: hasEnum || subSamespaces.some((x) => x.importEnum),
    importCache: hasCache || subSamespaces.some((x) => x.importCache),
    importPubSub: hasPubsub || subSamespaces.some((x) => x.importPubSub),
    importTask: hasTask || subSamespaces.some((x) => x.importTask),
  };
};

export const codegen: (namespaces: Namespace) => string = (
  unflattenNamespace
) => {
  const namespace = flatNamespace(unflattenNamespace);
  const { code } = namespaceToCode(namespace);

  const importCode = ([] as string[])
    .concat([
      `extern crate memorix_redis;
extern crate serde;
extern crate serde_json;`,
    ])
    .join("\n");
  return `${importCode}

${code}`;
};
