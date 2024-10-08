use crate::{
    export_schema::ExportNamespace,
    flat_schema::{FlatExportSchema, FlatTypeItem, TypeItemObject},
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

fn namespace_to_code(namespace: &ExportNamespace<FlatTypeItem>, name_tree: Vec<String>) -> String {
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
                    .collect()
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
            struct_content = namespace
                .cache_items
                .iter()
                .map(|(name, item)| {
                    let payload = flat_type_item_to_code(&item.payload);
                    format!(
                        "{indent1}pub {name}: memorix_client_redis::MemorixCacheItem{},",
                        match &item.key {
                            None => format!("NoKey<{payload}>"),
                            Some(key) => {
                                let key = flat_type_item_to_code(&key);
                                format!("<{key}, {payload}>")
                            }
                        }
                    )
                })
                .collect::<Vec<_>>()
                .join("\n"),
            impl_content = namespace
                .cache_items
                .iter()
                .map(|(name, item)| {
                    format!(
                        r#"{indent3}{name}: memorix_client_redis::MemorixCacheItem{}::new(
{indent4}memorix_base.clone(),
{indent4}"{name}".to_string(),
{indent4}None,
{indent3}),"#,
                        match &item.key {
                            None => format!("NoKey"),
                            Some(_) => format!(""),
                        },
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
    result.push_str(&format!(
        r#"#[derive(Clone)]
#[allow(non_snake_case)]
pub struct Memorix{name_pascal} {{
{struct_content}
}}

const {name_tree_const_name}: &[&str] = &[{}];"#,
        name_tree
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
            vec![]
        )
    )
    .to_string()
}
