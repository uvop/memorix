use crate::flat_schema::{FlatExportNamespace, FlatExportSchema, FlatTypeItem, TypeItemObject};

fn indent(level: usize) -> String {
    "  ".repeat(level)
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
"#, type_item_object.properties.iter().map(|(property_name, flat_type_item)| format!("{}{property_indent}{property_name}: {},", match flat_type_item {
    FlatTypeItem::Optional(_) => "#[serde(skip_serializing_if = \"Option::is_none\")]\n",
    _ => "",
},flat_type_item_to_code(flat_type_item)).to_string()).collect::<Vec<_>>().join("\n")).to_string()
}

fn namespace_to_code(flat_namespace: &FlatExportNamespace, name_tree: Vec<String>) -> String {
    let mut result = String::from("");

    for (name, flat_type_item) in &flat_namespace.modified_namespace.type_items {
        result.push_str(&format!(
            "type {name} = {}\n",
            flat_type_item_to_code(flat_type_item)
        ));
    }
    for (name, type_item_object) in &flat_namespace.type_item_objects {
        result.push_str(&format!(
            "{}\n",
            type_item_object_to_code(name.as_str(), type_item_object)
        ));
    }
    let name = name_tree.last().map_or("".to_string(), |v| v.clone());
    let name_pascal = stringcase::pascal_case(&name);
    let name_macro = stringcase::macro_case(&name);
    let name_tree_const_name = match name_tree.len() == 0 {
        true => "MEMORIX_NAMESPACE_NAME_TREE".to_string(),
        false => format!("MEMORIX_{name_macro}_NAMESPACE_NAME_TREE"),
    };
    result.push_str(&format!(
        r#"#[derive(Clone)]
#[allow(non_snake_case)]
pub struct Memorix{name_pascal} {{
}}

const {name_tree_const_name}: &[&str] = &[{}];"#,
        name_tree
            .iter()
            .map(|x| format!("\"{}\"", x))
            .collect::<Vec<_>>()
            .join(", ")
    ));
    result
}

pub fn codegen(flat_export_schema: &FlatExportSchema) -> String {
    format!(
        r#"#![allow(dead_code)]
extern crate memorix_client_redis;

{}"#,
        namespace_to_code(&flat_export_schema.global_namespace, vec![])
    )
    .to_string()
}
