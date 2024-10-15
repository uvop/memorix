use crate::{
    flat_schema::{FlatExportNamespace, FlatExportSchema, FlatTypeItem, TypeItemObject},
    parser::{Engine, Value, ALL_CACHE_OPERATIONS, ALL_PUBSUB_OPERATIONS, ALL_TASK_OPERATIONS},
};

fn indent(level: usize) -> String {
    "    ".repeat(level)
}
fn flat_type_item_to_code(flat_type_item: &FlatTypeItem) -> String {
    match flat_type_item {
        FlatTypeItem::Optional(x) => format!("Option<{}>", flat_type_item_to_code(x)).to_string(),
        FlatTypeItem::Array(x) => format!("Vec<{}>", flat_type_item_to_code(x)).to_string(),
        FlatTypeItem::Reference(x) => x.clone(),
        FlatTypeItem::Boolean => "bool".to_string(),
        FlatTypeItem::String => "String".to_string(),
        FlatTypeItem::U32 => "u32".to_string(),
        FlatTypeItem::U64 => "u64".to_string(),
        FlatTypeItem::I32 => "i32".to_string(),
        FlatTypeItem::I64 => "i64".to_string(),
        FlatTypeItem::F32 => "f32".to_string(),
        FlatTypeItem::F64 => "f64".to_string(),
    }
}

fn value_to_code(value: &Value) -> String {
    match value {
        Value::String(x) => format!("\"{x}\".to_string()"),
        Value::Env(x) => {
            format!("std::env::var(\"{x}\").expect(\"missing environment variable {x}\")")
        }
    }
}

fn type_item_object_to_code(name: &str, type_item_object: &TypeItemObject) -> String {
    let property_indent = indent(1);
    format!(
        r#"
#[memorix_client_redis::serialization]
#[derive(Clone, PartialEq, std::fmt::Debug)]
pub struct {name} {{
{}
}}
"#,
        type_item_object
            .properties
            .iter()
            .map(|(property_name, flat_type_item)| format!(
                "{property_indent}pub {}: {},",
                match property_name == "type" {
                    true => "r#type",
                    false => property_name,
                },
                flat_type_item_to_code(flat_type_item)
            )
            .to_string())
            .collect::<Vec<_>>()
            .join("\n")
    )
    .to_string()
}

fn namespace_to_code(
    namespace: &FlatExportNamespace,
    name_tree: Vec<String>,
    engine: &Engine,
) -> String {
    let mut result = String::from("");
    let base_indent = indent(name_tree.len());

    for (name, values) in &namespace.enum_items {
        result.push_str(&format!(
            r#"
{base_indent}#[allow(non_camel_case_types, clippy::upper_case_acronyms)]
{base_indent}#[memorix_client_redis::serialization]
{base_indent}#[derive(Clone, PartialEq, std::fmt::Debug)]
{base_indent}pub enum {name} {{
{}
}}

"#,
            values
                .iter()
                .map(|x| format!("{base_indent}    {x},"))
                .collect::<Vec<_>>()
                .join("\n")
        ));
    }
    for (name, type_item_object) in &namespace.type_item_objects {
        result.push_str(&format!(
            "{}\n",
            type_item_object_to_code(name.as_str(), type_item_object)
        ));
    }
    for (name, flat_type_item) in &namespace.flat_type_items {
        result.push_str(&format!(
            "{base_indent}pub type {name} = {};\n\n",
            flat_type_item_to_code(flat_type_item)
        ));
    }
    for (name, sub_namespace) in &namespace.namespaces {
        result.push_str(&format!(
            r#"{base_indent}pub mod {name} {{
{base_indent}    use super::*;

{namespace_content}
{base_indent}}}
"#,
            name = stringcase::snake_case(name),
            namespace_content = namespace_to_code(
                sub_namespace,
                name_tree
                    .clone()
                    .into_iter()
                    .chain(std::iter::once(name.clone()))
                    .collect(),
                engine,
            ),
        ));
    }
    if !namespace.cache_items.is_empty() {
        result.push_str(&format!(
            r#"{base_indent}#[derive(Clone)]
{base_indent}#[allow(non_snake_case)]
{base_indent}pub struct MemorixCache {{
{struct_content}
{base_indent}}}

{base_indent}impl MemorixCache {{
{base_indent}    fn new(memorix_base: memorix_client_redis::MemorixBase) -> Result<Self, Box<dyn std::error::Error + Sync + Send>> {{
{base_indent}        Ok(Self {{
{impl_content}
{base_indent}        }})
{base_indent}    }}
{base_indent}}}

"#,
            struct_content =
                namespace
                    .cache_items
                    .iter()
                    .map(|(name, item)| {
                        let payload = flat_type_item_to_code(&item.payload);
                        format!(
                        "{base_indent}    pub {name}: memorix_client_redis::MemorixCacheItem{key}{api}>,",
                        key = match &item.key {
                            None => format!("NoKey<{payload}, "),
                            Some(key) => {
                                let key = flat_type_item_to_code(key);
                                format!("<{key}, {payload}, ")
                            }
                        },
                        api = ALL_CACHE_OPERATIONS.iter().map(|x| match item.expose.contains(x) {
                            true => "memorix_client_redis::Expose",
                            false => "memorix_client_redis::Hide",
                        }).collect::<Vec<_>>().join(", ")
                    )
                    })
                    .collect::<Vec<_>>()
                    .join("\n"),
            impl_content = namespace
                .cache_items
                .iter()
                .map(|(name, item)| {
                    let options = format!(
                        r#"Some(memorix_client_redis::MemorixCacheOptions {{
{content}
{base_indent}                }})"#,
                        content = [
                            format!(
                                "{base_indent}                    ttl: {},",
                                item.ttl.as_ref().map_or("None".to_string(), |x| format!(
                                    "Some({})",
                                    value_to_code(x)
                                ))
                            ),
                            format!(
                                "{base_indent}                    extend_on_get: {},",
                                item.extend_on_get.as_ref().map_or(
                                    "None".to_string(),
                                    |x| format!("Some({})", value_to_code(x))
                                )
                            ),
                        ]
                        .into_iter()
                        .collect::<Vec<_>>()
                        .join("\n")
                    );
                    format!(
                        r#"{base_indent}            {name}: memorix_client_redis::MemorixCacheItem{key}::new(
{base_indent}                memorix_base.clone(),
{base_indent}                "{name}".to_string(),
{base_indent}                {options},
{base_indent}            )?,"#,
                        key = match &item.key {
                            None => "NoKey",
                            Some(_) => "",
                        },
                        options = options,
                    )
                })
                .collect::<Vec<_>>()
                .join("\n")
        ));
    }
    if !namespace.pubsub_items.is_empty() {
        result.push_str(&format!(
            r#"{base_indent}#[derive(Clone)]
{base_indent}#[allow(non_snake_case)]
{base_indent}pub struct MemorixPubSub {{
{struct_content}
{base_indent}}}

{base_indent}impl MemorixPubSub {{
{base_indent}    fn new(memorix_base: memorix_client_redis::MemorixBase) -> Result<Self, Box<dyn std::error::Error + Sync + Send>> {{
{base_indent}        Ok(Self {{
{impl_content}
{base_indent}        }})
{base_indent}    }}
{base_indent}}}

"#,
            struct_content =
                namespace
                    .pubsub_items
                    .iter()
                    .map(|(name, item)| {
                        let payload = flat_type_item_to_code(&item.payload);
                        format!(
                        "{base_indent}    pub {name}: memorix_client_redis::MemorixPubSubItem{key}{api}>,",
                        key = match &item.key {
                            None => format!("NoKey<{payload}, "),
                            Some(key) => {
                                let key = flat_type_item_to_code(key);
                                format!("<{key}, {payload}, ")
                            }
                        },
                        api = ALL_PUBSUB_OPERATIONS.iter().map(|x| match item.expose.contains(x) {
                            true => "memorix_client_redis::Expose",
                            false => "memorix_client_redis::Hide",
                        }).collect::<Vec<_>>().join(", ")
                    )
                    })
                    .collect::<Vec<_>>()
                    .join("\n"),
            impl_content = namespace
                .pubsub_items
                .iter()
                .map(|(name, item)| {
                    format!(
                        r#"{base_indent}            {name}: memorix_client_redis::MemorixPubSubItem{key}::new(
{base_indent}                memorix_base.clone(),
{base_indent}                "{name}".to_string(),
{base_indent}            )?,"#,
                        key = match &item.key {
                            None => "NoKey",
                            Some(_) => "",
                        },
                    )
                })
                .collect::<Vec<_>>()
                .join("\n")
        ));
    }
    if !namespace.task_items.is_empty() {
        result.push_str(&format!(
            r#"{base_indent}#[derive(Clone)]
{base_indent}#[allow(non_snake_case)]
{base_indent}pub struct MemorixTask {{
{struct_content}
{base_indent}}}

{base_indent}impl MemorixTask {{
{base_indent}    fn new(memorix_base: memorix_client_redis::MemorixBase) -> Result<Self, Box<dyn std::error::Error + Sync + Send>> {{
{base_indent}        Ok(Self {{
{impl_content}
{base_indent}        }})
{base_indent}    }}
{base_indent}}}

"#,
            struct_content =
                namespace
                    .task_items
                    .iter()
                    .map(|(name, item)| {
                        let payload = flat_type_item_to_code(&item.payload);
                        format!(
                        "{base_indent}    pub {name}: memorix_client_redis::MemorixTaskItem{key}{api}>,",
                        key = match &item.key {
                            None => format!("NoKey<{payload}, "),
                            Some(key) => {
                                let key = flat_type_item_to_code(key);
                                format!("<{key}, {payload}, ")
                            }
                        },
                        api = ALL_TASK_OPERATIONS.iter().map(|x| match item.expose.contains(x) {
                            true => "memorix_client_redis::Expose",
                            false => "memorix_client_redis::Hide",
                        }).collect::<Vec<_>>().join(", ")
                    )
                    })
                    .collect::<Vec<_>>()
                    .join("\n"),
            impl_content = namespace
                .task_items
                .iter()
                .map(|(name, item)| {
                    let options = format!(
                        r#"Some(memorix_client_redis::MemorixTaskOptions {{
{content}
{base_indent}                }})"#,
                        content =
                            [format!(
                                "{base_indent}                    queue_type: {},",
                                item.queue_type.as_ref().map_or(
                                    "None".to_string(),
                                    |x| format!("Some({})", value_to_code(x))
                                )
                            ),]
                            .into_iter()
                            .collect::<Vec<_>>()
                            .join("\n")
                    );
                    format!(
                        r#"{base_indent}            {name}: memorix_client_redis::MemorixTaskItem{key}::new(
{base_indent}                memorix_base.clone(),
                "{name}".to_string(),
{base_indent}                {options},
{base_indent}            )?,"#,
                        key = match &item.key {
                            None => "NoKey",
                            Some(_) => "",
                        },
                        options = options,
                    )
                })
                .collect::<Vec<_>>()
                .join("\n")
        ));
    }

    result.push_str(&format!(
        r#"{base_indent}#[derive(Clone)]
{base_indent}#[allow(non_snake_case)]
{base_indent}pub struct Memorix {{
{struct_content}
{base_indent}}}

{base_indent}const MEMORIX_NAMESPACE_NAME_TREE: &[&str] = &[{name_tree}];

{base_indent}impl Memorix {{
{impl_new}
{base_indent}        Ok(Self {{
{impl_content}
{base_indent}        }})
{base_indent}    }}
{base_indent}}}
"#,
        name_tree = name_tree
            .iter()
            .map(|x| format!("\"{}\"", x))
            .collect::<Vec<_>>()
            .join(", "),
        struct_content = [
            namespace
                .namespaces
                .iter()
                .map(|(name, _)| format!(
                    "{base_indent}    pub {name}: {namespace_name}::Memorix,",
                    namespace_name = stringcase::snake_case(name)
                ))
                .collect::<Vec<_>>()
                .join("\n"),
            [
                (!namespace.cache_items.is_empty())
                    .then(|| format!("{base_indent}    pub cache: MemorixCache,")),
                (!namespace.pubsub_items.is_empty())
                    .then(|| format!("{base_indent}    pub pubsub: MemorixPubSub,")),
                (!namespace.task_items.is_empty())
                    .then(|| format!("{base_indent}    pub task: MemorixTask,")),
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
        impl_new = match name_tree.is_empty() {
            true => format!(r#"{base_indent}    pub async fn new() -> Result<Memorix, Box<dyn std::error::Error + Sync + Send>> {{
{base_indent}        let memorix_base = memorix_client_redis::MemorixBase::new(
{base_indent}            {redis_url},
{base_indent}            MEMORIX_NAMESPACE_NAME_TREE
{base_indent}        )
{base_indent}        .await?;"#, redis_url= match engine {
            Engine::Redis(x) => format!("&{}", value_to_code(x)),
            }),
            false => format!(
                r#"{base_indent}    pub fn new(
{base_indent}        other: memorix_client_redis::MemorixBase,
{base_indent}    ) -> Result<Memorix, Box<dyn std::error::Error + Sync + Send>> {{
{base_indent}        let memorix_base = memorix_client_redis::MemorixBase::from(
{base_indent}            other,
{base_indent}            MEMORIX_NAMESPACE_NAME_TREE
{base_indent}        );"#),
        },
        impl_content = [
            namespace
                .namespaces
                .iter()
                .map(|(name, _)| format!(
                    "{base_indent}            {name}: {namespace_name}::Memorix::new(memorix_base.clone())?,",
                    namespace_name = stringcase::snake_case(name),
                ))
                .collect::<Vec<_>>()
                .join("\n"),
            [
                (!namespace.cache_items.is_empty()).then(|| format!(
                    "{base_indent}           cache: MemorixCache::new(memorix_base.clone())?,"
                )),
                (!namespace.pubsub_items.is_empty()).then(|| format!(
                    "{base_indent}            pubsub: MemorixPubSub::new(memorix_base.clone())?,"
                )),
                (!namespace.task_items.is_empty()).then(|| format!(
                    "{base_indent}            task: MemorixTask::new(memorix_base.clone())?,"
                )),
            ]
            .into_iter()
            .flatten()
            .collect::<Vec<_>>()
            .join("\n")
        ]
        .into_iter()
        .filter(|x| !x.is_empty())
        .collect::<Vec<_>>()
        .join("\n\n")
    ));
    result
}

pub fn codegen(flat_export_schema: &FlatExportSchema) -> String {
    format!(
        r#"#![allow(dead_code)]
extern crate memorix_client_redis;

{}"#,
        namespace_to_code(
            &flat_export_schema.global_namespace,
            vec![],
            &flat_export_schema.engine,
        )
    )
    .to_string()
}
