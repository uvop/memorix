use crate::{
    export_schema::ExportNamespace,
    flat_schema::{FlatExportSchema, FlatTypeItem, TypeItemObject},
    parser::{
        Engine, NamespaceDefaults, Value, ALL_CACHE_OPERATIONS, ALL_PUBSUB_OPERATIONS,
        ALL_TASK_OPERATIONS,
    },
};

fn indent(level: usize) -> String {
    "    ".repeat(level)
}

fn namespace_defaults_to_code(namespace_defaults: &NamespaceDefaults, level: usize) -> String {
    let i1 = indent(level);
    let i2 = indent(level + 1);
    let content = [
        namespace_defaults
            .cache_ttl
            .clone()
            .map(|x| format!("{i2}cache_ttl: {},", value_to_code(&x))),
        namespace_defaults
            .cache_extend_on_get
            .clone()
            .map(|x| format!("{i2}cache_extend_on_get: {},", value_to_code(&x))),
        namespace_defaults
            .task_queue_type
            .clone()
            .map(|x| format!("{i2}task_queue_type: {},", value_to_code(&x))),
    ]
    .into_iter()
    .flatten()
    .collect::<Vec<_>>()
    .join("\n");

    match content.is_empty() {
        true => "None".to_string(),
        false => format!(
            r#"memorix_client_redis::MemorixNamespaceDefaults {{
{content}
{i1}}}"#
        ),
    }
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
        Value::String(x) => format!("\"{x}\""),
        Value::Env(x) => {
            format!("std::env::var(\"{x}\").expect(\"missing environment variable {x}\")")
        }
    }
}

fn type_item_object_to_code(name: &str, type_item_object: &TypeItemObject) -> String {
    let property_indent = indent(1);
    format!(r#"#[derive(Clone, memorix_client_redis::Serialize, memorix_client_redis::Deserialize, PartialEq, std::fmt::Debug)]
pub struct {name} {{
{}
}}
"#, type_item_object.properties.iter().map(|(property_name, flat_type_item)| format!(
    "{}{property_indent}pub {}: {},",
        match flat_type_item {
            FlatTypeItem::Optional(_) => format!("{property_indent}#[serde(skip_serializing_if = \"Option::is_none\")]\n"),
            _ => "".to_string(),
        },
        match property_name == "type" {
            true => "r#type",
            false => property_name,
        },
        flat_type_item_to_code(flat_type_item)
    ).to_string()).collect::<Vec<_>>().join("\n")).to_string()
}

fn namespace_to_code(
    namespace: &ExportNamespace<FlatTypeItem>,
    name_tree: Vec<String>,
    engine: &Engine,
) -> String {
    let mut result = String::from("");
    let indent1 = indent(1);
    let indent3 = indent(3);
    let indent4 = indent(4);
    let name = name_tree.last().map_or("".to_string(), |v| v.clone());
    let name_pascal = stringcase::pascal_case(&name);
    let name_macro = stringcase::macro_case(&name);

    for (name, values) in &namespace.enum_items {
        result.push_str(&format!(
            r#"#[allow(non_camel_case_types, clippy::upper_case_acronyms)]
#[derive(Clone, memorix_client_redis::Serialize, memorix_client_redis::Deserialize, PartialEq, std::fmt::Debug,
)]
pub enum {name} {{
{}
}}

"#,
            values
                .iter()
                .map(|x| format!("{indent1}{x},"))
                .collect::<Vec<_>>()
                .join("\n")
        ));
    }
    for (name, flat_type_item) in &namespace.type_items {
        result.push_str(&format!(
            "pub type {name} = {};\n\n",
            flat_type_item_to_code(flat_type_item)
        ));
    }
    for (name, sub_namespace) in &namespace.namespaces {
        result.push_str(&format!(
            "{}\n",
            namespace_to_code(
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
    if namespace.cache_items.len() != 0 {
        result.push_str(&format!(
            r#"#[derive(Clone)]
#[allow(non_snake_case)]
pub struct MemorixCache{name_pascal} {{
{struct_content}
}}

impl MemorixCache{name_pascal} {{
    fn new(memorix_base: memorix_client_redis::MemorixBase) -> Self {{
        Self {{
{impl_content}
        }}
    }}
}}

"#,
            struct_content =
                namespace
                    .cache_items
                    .iter()
                    .map(|(name, item)| {
                        let payload = flat_type_item_to_code(&item.payload);
                        format!(
                        "{indent1}pub {name}: memorix_client_redis::MemorixCacheItem{key}{api}>,",
                        key = match &item.key {
                            None => format!("NoKey<{payload}, "),
                            Some(key) => {
                                let key = flat_type_item_to_code(&key);
                                format!("<{key}, {payload}, ")
                            }
                        },
                        api = ALL_CACHE_OPERATIONS.iter().map(|x| match item.expose.contains(&x) {
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
                    format!(
                        r#"{indent3}{name}: memorix_client_redis::MemorixCacheItem{key}::new(
{indent4}memorix_base.clone(),
{indent4}"{name}".to_string(),
{indent4}{options},
{indent3}),"#,
                        key = match &item.key {
                            None => format!("NoKey"),
                            Some(_) => format!(""),
                        },
                        options = {
                            let content = [
                                item.ttl.clone().map(|x| {
                                    format!("                    ttl: {},", value_to_code(&x))
                                }),
                                item.extend_on_get.clone().map(|x| {
                                    format!(
                                        "                    extend_on_get: {},",
                                        value_to_code(&x)
                                    )
                                }),
                            ]
                            .into_iter()
                            .flatten()
                            .collect::<Vec<_>>()
                            .join("\n");

                            match content.is_empty() {
                                true => "None".to_string(),
                                false => format!(
                                    r#"memorix_client_redis::MemorixCacheOptions {{
{content}
                }}"#
                                ),
                            }
                        },
                    )
                })
                .collect::<Vec<_>>()
                .join("\n")
        ));
    }
    if namespace.pubsub_items.len() != 0 {
        result.push_str(&format!(
            r#"#[derive(Clone)]
#[allow(non_snake_case)]
pub struct MemorixPubSub{name_pascal} {{
{struct_content}
}}

impl MemorixPubSub{name_pascal} {{
    fn new(memorix_base: memorix_client_redis::MemorixBase) -> Self {{
        Self {{
{impl_content}
        }}
    }}
}}

"#,
            struct_content =
                namespace
                    .pubsub_items
                    .iter()
                    .map(|(name, item)| {
                        let payload = flat_type_item_to_code(&item.payload);
                        format!(
                        "{indent1}pub {name}: memorix_client_redis::MemorixPubSubItem{key}{api}>,",
                        key = match &item.key {
                            None => format!("NoKey<{payload}, "),
                            Some(key) => {
                                let key = flat_type_item_to_code(&key);
                                format!("<{key}, {payload}, ")
                            }
                        },
                        api = ALL_PUBSUB_OPERATIONS.iter().map(|x| match item.expose.contains(&x) {
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
                        r#"{indent3}{name}: memorix_client_redis::MemorixPubSubItem{key}::new(
{indent4}memorix_base.clone(),
{indent4}"{name}".to_string(),
{indent3}),"#,
                        key = match &item.key {
                            None => format!("NoKey"),
                            Some(_) => format!(""),
                        },
                    )
                })
                .collect::<Vec<_>>()
                .join("\n")
        ));
    }
    if namespace.task_items.len() != 0 {
        result.push_str(&format!(
            r#"#[derive(Clone)]
#[allow(non_snake_case)]
pub struct MemorixTask{name_pascal} {{
{struct_content}
}}

impl MemorixTask{name_pascal} {{
    fn new(memorix_base: memorix_client_redis::MemorixBase) -> Self {{
        Self {{
{impl_content}
        }}
    }}
}}

"#,
            struct_content =
                namespace
                    .task_items
                    .iter()
                    .map(|(name, item)| {
                        let payload = flat_type_item_to_code(&item.payload);
                        format!(
                        "{indent1}pub {name}: memorix_client_redis::MemorixTaskItem{key}{api}>,",
                        key = match &item.key {
                            None => format!("NoKey<{payload}, "),
                            Some(key) => {
                                let key = flat_type_item_to_code(&key);
                                format!("<{key}, {payload}, ")
                            }
                        },
                        api = ALL_TASK_OPERATIONS.iter().map(|x| match item.expose.contains(&x) {
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
                    format!(
                        r#"{indent3}{name}: memorix_client_redis::MemorixTaskItem{key}::new(
{indent4}memorix_base.clone(),
{indent4}"{name}".to_string(),
{indent4}{options},
{indent3}),"#,
                        key = match &item.key {
                            None => format!("NoKey"),
                            Some(_) => format!(""),
                        },
                        options = {
                            let content = [item.queue_type.clone().map(|x| {
                                format!("                    queue_type: {},", value_to_code(&x))
                            })]
                            .into_iter()
                            .flatten()
                            .collect::<Vec<_>>()
                            .join("\n");

                            match content.is_empty() {
                                true => "None".to_string(),
                                false => format!(
                                    r#"memorix_client_redis::MemorixTaskOptions {{
{content}
                }}"#
                                ),
                            }
                        }
                    )
                })
                .collect::<Vec<_>>()
                .join("\n")
        ));
    }

    let name_tree_const_name = match name_tree.len() == 0 {
        true => "MEMORIX_NAMESPACE_NAME_TREE".to_string(),
        false => format!("MEMORIX_{name_macro}_NAMESPACE_NAME_TREE"),
    };
    let namespace_defaults = namespace_defaults_to_code(&namespace.defaults, 3);
    result.push_str(&format!(
        r#"#[derive(Clone)]
#[allow(non_snake_case)]
pub struct Memorix{name_pascal} {{
{struct_content}
}}

const {name_tree_const_name}: &[&str] = &[{name_tree}];

impl Memorix{name_pascal} {{
{impl_new}
        Ok(Self {{
{impl_content}
        }})
    }}
}}
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
                    "{indent1}pub {name}: Memorix{},",
                    stringcase::pascal_case(&name)
                ))
                .collect::<Vec<_>>()
                .join("\n"),
            [
                (!namespace.cache_items.is_empty())
                    .then(|| format!("{indent1}pub cache: MemorixCache{name_pascal},")),
                (!namespace.pubsub_items.is_empty())
                    .then(|| format!("{indent1}pub pubsub: MemorixPubSub{name_pascal},")),
                (!namespace.task_items.is_empty())
                    .then(|| format!("{indent1}pub task: MemorixTask{name_pascal},")),
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
            true => format!(r#"    pub async fn new() -> Result<Memorix, Box<dyn std::error::Error + Sync + Send>> {{
        let memorix_base = memorix_client_redis::MemorixBase::new(
            {redis_url},
            {name_tree_const_name},
            {namespace_defaults}
        )
        .await?;"#, redis_url= match engine {
            Engine::Redis(redis) => value_to_code(redis),
            }),
            false => format!(
                r#"    pub fn new(
        other: memorix_client_redis::MemorixBase,
    ) -> Result<Memorix{name_pascal}, Box<dyn std::error::Error + Sync + Send>> {{
        let memorix_base = memorix_client_redis::MemorixBase::from(
            other,
{indent3}{name_tree_const_name},
            {namespace_defaults},
        );"#),
        },
        impl_content = [
            namespace
                .namespaces
                .iter()
                .map(|(name, _)| format!(
                    "{indent3}{name}: Memorix{}::new(memorix_base.clone())?,",
                    stringcase::pascal_case(&name)
                ))
                .collect::<Vec<_>>()
                .join("\n"),
            [
                (!namespace.cache_items.is_empty()).then(|| format!(
                    "{indent3}cache: MemorixCache{name_pascal}::new(memorix_base.clone()),"
                )),
                (!namespace.pubsub_items.is_empty()).then(|| format!(
                    "{indent3}pubsub: MemorixPubSub{name_pascal}::new(memorix_base.clone()),"
                )),
                (!namespace.task_items.is_empty()).then(|| format!(
                    "{indent3}task: MemorixTask{name_pascal}::new(memorix_base.clone()),"
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

{}
{}"#,
        flat_export_schema
            .global_namespace
            .type_item_objects
            .iter()
            .map(|(name, type_item_object)| format!(
                "{}\n",
                type_item_object_to_code(name.as_str(), type_item_object)
            ))
            .collect::<Vec<_>>()
            .join("\n"),
        namespace_to_code(
            &flat_export_schema.global_namespace.modified_namespace,
            vec![],
            &flat_export_schema.engine,
        )
    )
    .to_string()
}
