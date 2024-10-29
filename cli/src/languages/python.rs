use crate::{
    flat_schema::{
        FlatValidatedNamespace, FlatValidatedReferenceTypeItemKind, FlatValidatedSchema,
        FlatValidatedTypeItem, TypeObjectItem,
    },
    parser::{Engine, Value, ALL_CACHE_OPERATIONS, ALL_PUBSUB_OPERATIONS, ALL_TASK_OPERATIONS},
};

fn indent(level: usize) -> String {
    "    ".repeat(level)
}
fn flat_type_item_to_code(
    flat_type_item: &FlatValidatedTypeItem,
    schema: &FlatValidatedSchema,
) -> String {
    match flat_type_item {
        FlatValidatedTypeItem::Optional(x) => {
            format!("typing.Optional[{}]", flat_type_item_to_code(x, schema)).to_string()
        }
        FlatValidatedTypeItem::Array(x) => {
            format!("typing.List[{}]", flat_type_item_to_code(x, schema)).to_string()
        }
        FlatValidatedTypeItem::Reference(x) => {
            let (namespace, namespace_names) = x.namespace_indexes.iter().fold(
                (&schema.global_namespace, Vec::<&str>::new()),
                |(current_namespace, mut acc), &i| {
                    let (next_name, next_namespace) = &current_namespace.namespaces[i];
                    acc.push(next_name.as_str());
                    (next_namespace, acc)
                },
            );
            format!(
                "{prefix}{seperator}{name}",
                prefix = namespace_names
                    .iter()
                    .map(|x| stringcase::pascal_case(x))
                    .collect::<Vec<_>>()
                    .join("."),
                seperator = match namespace_names.is_empty() {
                    true => "",
                    false => ".",
                },
                name = match x.kind {
                    FlatValidatedReferenceTypeItemKind::TypeItem(i) => {
                        namespace.flat_type_items[i].0.clone()
                    }
                    FlatValidatedReferenceTypeItemKind::TypeObjectItem(i) => {
                        namespace.type_object_items[i].0.clone()
                    }
                    FlatValidatedReferenceTypeItemKind::Enum(i) => {
                        namespace.enum_items[i].0.clone()
                    }
                }
            )
        }
        FlatValidatedTypeItem::Boolean => "bool".to_string(),
        FlatValidatedTypeItem::String => "str".to_string(),
        FlatValidatedTypeItem::U32 => "int".to_string(),
        FlatValidatedTypeItem::U64 => "int".to_string(),
        FlatValidatedTypeItem::I32 => "int".to_string(),
        FlatValidatedTypeItem::I64 => "int".to_string(),
        FlatValidatedTypeItem::F32 => "float".to_string(),
        FlatValidatedTypeItem::F64 => "float".to_string(),
    }
}

fn value_to_code(value: &Value) -> String {
    match value {
        Value::String(x) => format!("\"{x}\""),
        Value::Env(x) => {
            format!("os.environ[\"{x}\"]")
        }
    }
}

fn type_item_object_to_code(
    name: &str,
    type_item_object: &TypeObjectItem,
    schema: &FlatValidatedSchema,
    level: usize,
) -> String {
    let base_indent = indent(level);
    format!(
        r#"
{base_indent}@dataclass
{base_indent}class {name}(object):
{}
"#,
        type_item_object
            .properties
            .iter()
            .map(|(property_name, flat_type_item)| format!(
                "{base_indent}    {property_name}: {}",
                flat_type_item_to_code(flat_type_item, schema)
            )
            .to_string())
            .collect::<Vec<_>>()
            .join("\n")
    )
    .to_string()
}

fn namespace_to_code(
    namespace: &FlatValidatedNamespace,
    name_tree: Vec<String>,
    schema: &FlatValidatedSchema,
) -> String {
    let mut result = String::from("");
    let base_indent = indent(name_tree.len());

    for (name, values) in &namespace.enum_items {
        result.push_str(&format!(
            r#"
{base_indent}class {name}(str, Enum):
{}

"#,
            values
                .iter()
                .map(|x| format!("{base_indent}    {x} = \"{x}\""))
                .collect::<Vec<_>>()
                .join("\n")
        ));
    }
    for (name, type_item_object) in &namespace.type_object_items {
        result.push_str(&format!(
            "{}\n",
            type_item_object_to_code(name.as_str(), type_item_object, schema, name_tree.len())
        ));
    }
    for (name, flat_type_item) in &namespace.flat_type_items {
        result.push_str(&format!(
            "{base_indent}{name} = {}\n\n",
            flat_type_item_to_code(flat_type_item, schema)
        ));
    }
    for (name, sub_namespace) in &namespace.namespaces {
        result.push_str(&format!(
            r#"{base_indent}class {name}(object):
{namespace_content}
"#,
            name = stringcase::pascal_case(name),
            namespace_content = namespace_to_code(
                sub_namespace,
                name_tree
                    .clone()
                    .into_iter()
                    .chain(std::iter::once(name.clone()))
                    .collect(),
                schema,
            ),
        ));
    }
    if !namespace.cache_items.is_empty() {
        result.push_str(&format!(
            r#"
{base_indent}class MemorixCache(MemorixCacheAll.Base):
{base_indent}    def __init__(self, api: MemorixBase) -> None:
{base_indent}        super().__init__(api=api)

{class_content}

"#,
            class_content = namespace
                .cache_items
                .iter()
                .map(|(name, item)| {
                    let payload = flat_type_item_to_code(&item.payload, schema);
                    format!(
                        r#"{base_indent}        self.{name} = MemorixCacheAll.Item{api}{key}](
{base_indent}            api=api,
{base_indent}            id="{name}",
{base_indent}            payload_class={payload},{options}
{base_indent}        )"#,
                        key = match &item.key {
                            None => format!("NoKey[{payload}"),
                            Some(key) => {
                                let key = flat_type_item_to_code(key, schema);
                                format!("[{key}, {payload}")
                            }
                        },
                        api = ALL_CACHE_OPERATIONS
                            .iter()
                            .map(|x| match item.expose.contains(x) {
                                true => "T",
                                false => "F",
                            })
                            .collect::<Vec<_>>()
                            .join(""),
                        options = {
                            let content = [
                                item.ttl.as_ref().map(|x| {
                                    format!(
                                        "{base_indent}                ttl={},",
                                        value_to_code(x)
                                    )
                                }),
                                item.extend_on_get.as_ref().map(|x| {
                                    format!(
                                        "{base_indent}                extend_on_get={},",
                                        value_to_code(x)
                                    )
                                }),
                            ]
                            .into_iter()
                            .flatten()
                            .collect::<Vec<_>>()
                            .join("\n");
                            match content.is_empty() {
                                true => "".to_string(),
                                false => format!(
                                    r#"
{base_indent}            options=MemorixCacheAll.Options(
{content}
{base_indent}            )"#
                                ),
                            }
                        }
                    )
                })
                .collect::<Vec<_>>()
                .join("\n"),
        ));
    }
    if !namespace.pubsub_items.is_empty() {
        result.push_str(&format!(
            r#"
{base_indent}class MemorixPubSub(MemorixPubSubAll.Base):
{base_indent}    def __init__(self, api: MemorixBase) -> None:
{base_indent}        super().__init__(api=api)

{class_content}

"#,
            class_content = namespace
                .pubsub_items
                .iter()
                .map(|(name, item)| {
                    let payload = flat_type_item_to_code(&item.payload, schema);
                    format!(
                        r#"{base_indent}        self.{name} = MemorixPubSubAll.Item{api}{key}](
{base_indent}            api=api,
{base_indent}            id="{name}",
{base_indent}            payload_class={payload},
{base_indent}        )"#,
                        key = match &item.key {
                            None => format!("NoKey[{payload}"),
                            Some(key) => {
                                let key = flat_type_item_to_code(key, schema);
                                format!("[{key}, {payload}")
                            }
                        },
                        api = ALL_PUBSUB_OPERATIONS
                            .iter()
                            .map(|x| match item.expose.contains(x) {
                                true => "T",
                                false => "F",
                            })
                            .collect::<Vec<_>>()
                            .join("")
                    )
                })
                .collect::<Vec<_>>()
                .join("\n"),
        ));
    }
    if !namespace.task_items.is_empty() {
        result.push_str(&format!(
            r#"
{base_indent}class MemorixTask(MemorixTaskAll.Base):
{base_indent}    def __init__(self, api: MemorixBase) -> None:
{base_indent}        super().__init__(api=api)

{class_content}

"#,
            class_content = namespace
                .task_items
                .iter()
                .map(|(name, item)| {
                    let payload = flat_type_item_to_code(&item.payload, schema);
                    format!(
                        r#"{base_indent}        self.{name} = MemorixTaskAll.Item{api}{key}](
{base_indent}            api=api,
{base_indent}            id="{name}",
{base_indent}            payload_class={payload},{options}
{base_indent}        )"#,
                        key = match &item.key {
                            None => format!("NoKey[{payload}"),
                            Some(key) => {
                                let key = flat_type_item_to_code(key, schema);
                                format!("[{key}, {payload}")
                            }
                        },
                        api = ALL_TASK_OPERATIONS
                            .iter()
                            .map(|x| match item.expose.contains(x) {
                                true => "T",
                                false => "F",
                            })
                            .collect::<Vec<_>>()
                            .join(""),
                        options = {
                            let content = [item.queue_type.as_ref().map(|x| {
                                format!(
                                    "{base_indent}                queue_type={},",
                                    value_to_code(x)
                                )
                            })]
                            .into_iter()
                            .flatten()
                            .collect::<Vec<_>>()
                            .join("\n");
                            match content.is_empty() {
                                true => "".to_string(),
                                false => format!(
                                    r#"
{base_indent}            options=MemorixTaskAll.Options(
{content}
{base_indent}            )"#
                                ),
                            }
                        }
                    )
                })
                .collect::<Vec<_>>()
                .join("\n"),
        ));
    }
    let pre_namespace = match name_tree.is_empty() {
        true => "".to_string(),
        false => format!(
            "{}.",
            name_tree
                .iter()
                .map(|x| stringcase::pascal_case(x))
                .collect::<Vec<_>>()
                .join(".")
        ),
    };
    result.push_str(&format!(
        r#"{base_indent}class Memorix(MemorixBase):
{init_def}

{base_indent}        self._namespace_name_tree = [{name_tree}]
{class_content}
"#,
        name_tree = name_tree
            .iter()
            .map(|x| format!("\"{}\"", x))
            .collect::<Vec<_>>()
            .join(", "),
        init_def = match name_tree.is_empty() {
            true => format!(
                r#"{base_indent}    def __init__(self) -> None:
{base_indent}        super().__init__(redis_url={redis_url})
"#,
                redis_url = match &schema.engine {
                    Engine::Redis(x) => value_to_code(x),
                }
            ),
            false => format!(
                r#"{base_indent}    def __init__(self, ref: MemorixBase) -> None:
{base_indent}        super().__init__(ref=ref)
"#
            ),
        },
        class_content = [
            namespace
                .namespaces
                .iter()
                .map(|(name, _)| format!(
                    "{base_indent}        self.{name} = {pre_namespace}{namespace_name}.Memorix(ref=self)",
                    namespace_name = stringcase::pascal_case(name)
                ))
                .collect::<Vec<_>>()
                .join("\n"),
            [
                (!namespace.cache_items.is_empty())
                    .then(|| format!("{base_indent}        self.cache = {pre_namespace}MemorixCache(self)")),
                (!namespace.pubsub_items.is_empty())
                    .then(|| format!("{base_indent}        self.pubsub = {pre_namespace}MemorixPubSub(self)")),
                (!namespace.task_items.is_empty())
                    .then(|| format!("{base_indent}        self.task = {pre_namespace}MemorixTask(self)")),
            ]
            .into_iter()
            .flatten()
            .collect::<Vec<_>>()
            .join("\n")
        ]
        .into_iter()
        .filter(|x| !x.is_empty())
        .collect::<Vec<_>>()
        .join("\n\n"),
    ));
    result
}

pub fn codegen(schema: &FlatValidatedSchema) -> String {
    format!(
        r#"# flake8: noqa
import typing
import os

if typing.TYPE_CHECKING:
    from dataclasses import dataclass
else:
    from memorix_client_redis import dataclass

from enum import Enum
from memorix_client_redis import (
    MemorixBase,
    MemorixCacheAll,
    MemorixPubSubAll,
    MemorixTaskAll,
)

{}"#,
        namespace_to_code(&schema.global_namespace, vec![], schema)
    )
    .to_string()
}
