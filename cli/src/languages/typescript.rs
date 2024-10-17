use crate::{
    export_schema::{ExportNamespace, ExportSchema},
    parser::TypeItem,
    parser::{Engine, Value, ALL_CACHE_OPERATIONS, ALL_PUBSUB_OPERATIONS, ALL_TASK_OPERATIONS},
};

fn indent(level: usize) -> String {
    "  ".repeat(level)
}
fn type_item_to_code(type_item: &TypeItem, level: usize) -> String {
    let base_indent = indent(level);

    match type_item {
        TypeItem::Object(x) => format!(
            r#"{{
{}
{base_indent}}}"#,
            x.iter()
                .map(|(property_name, type_item)| format!(
                    "{base_indent}  {property_name}: {};",
                    type_item_to_code(type_item, level + 1)
                )
                .to_string())
                .collect::<Vec<_>>()
                .join("\n")
        ),
        TypeItem::Optional(x) => format!("undefined | {}", type_item_to_code(x, level)).to_string(),
        TypeItem::Array(x) => format!(
            r#"Array<
{}
{base_indent}>"#,
            type_item_to_code(x, level + 1)
        )
        .to_string(),
        TypeItem::Reference(x) => x.clone(),
        TypeItem::Boolean => "boolean".to_string(),
        TypeItem::String => "string".to_string(),
        TypeItem::U32 => "number".to_string(),
        TypeItem::U64 => "number".to_string(),
        TypeItem::I32 => "number".to_string(),
        TypeItem::I64 => "number".to_string(),
        TypeItem::F32 => "number".to_string(),
        TypeItem::F64 => "number".to_string(),
    }
}

fn value_to_code(value: &Value) -> String {
    match value {
        Value::String(x) => format!("\"{x}\""),
        Value::Env(x) => {
            format!("getEnvVariable(\"{x}\")")
        }
    }
}

fn namespace_to_code(
    namespace: &ExportNamespace,
    name_tree: Vec<String>,
    engine: &Engine,
) -> String {
    let mut result = String::from("");
    let level = name_tree.len();
    let base_indent = indent(level);

    for (name, values) in &namespace.enum_items {
        result.push_str(&format!(
            r#"{base_indent}export enum {name} {{
{}
}}

"#,
            values
                .iter()
                .map(|x| format!("{base_indent}  {x} = \"{x}\","))
                .collect::<Vec<_>>()
                .join("\n")
        ));
    }
    for (name, type_item) in &namespace.type_items {
        result.push_str(&format!(
            "{base_indent}export type {name} = {};\n\n",
            type_item_to_code(type_item, level)
        ));
    }
    for (name, sub_namespace) in &namespace.namespaces {
        result.push_str(&format!(
            r#"{base_indent}export namespace {name} {{
{namespace_content}
{base_indent}}}
"#,
            name = stringcase::camel_case(name),
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
    result.push_str(&format!(
        r#"{base_indent}export class Memorix extends MemorixBase {{{start}
{base_indent}  protected override namespaceNameTree = [{name_tree}];

{class_content}
{base_indent}}}"#,
start= match name_tree.is_empty() {
      true => format!(r#"
{base_indent}  protected override redisUrl = {redis_url};
"#, redis_url = match engine {
    Engine::Redis(x) => value_to_code(x),
    }),
    false => "".to_string(),
},
        name_tree = name_tree
            .iter()
            .map(|x| format!("\"{}\"", x))
            .collect::<Vec<_>>()
            .join(", "),
        class_content = [
            namespace
                .namespaces
                .iter()
                .map(|(name, _)| format!(
                    "{base_indent}  {name} = this.getNamespaceItem({namespace_name}.Memorix);",
                    namespace_name = stringcase::camel_case(name)
                ))
                .collect::<Vec<_>>()
                .join("\n"),
            [
                (!namespace.cache_items.is_empty()).then(|| format!(
                    r#"{base_indent}  cache = {{
{}
{base_indent}  }};"#,
                    namespace
                        .cache_items
                        .iter()
                        .map(|(name, item)| {
                            let payload = type_item_to_code(&item.payload, level + 2);
                            format!(
                                "{base_indent}    {name}: this.getCacheItem{key}{api}>(\"{name}\"{options}),",
                                key = match &item.key {
                                    None => format!("NoKey<{payload}, "),
                                    Some(key) => {
                                        let key = type_item_to_code(key, level + 2);
                                        format!("<{key}, {payload}, ")
                                    }
                                },
                                api = ALL_CACHE_OPERATIONS
                                    .iter()
                                    .map(|x| match item.expose.contains(x) {
                                        true => "true",
                                        false => "false",
                                    })
                                    .collect::<Vec<_>>()
                                    .join(", "),
                                    options = {
                                        let content = [
                                            item.ttl.as_ref().map(|x| format!(
                                                "{base_indent}      ttl: {},",value_to_code(x))),
                                            item.extend_on_get.as_ref().map(|x| format!(
                                                    "{base_indent}      extendOnGet: {},",value_to_code(x))),
                                        ]
                                        .into_iter()
                                        .flatten()
                                        .collect::<Vec<_>>()
                                        .join("\n");
                                        match content.is_empty() {
                                            true => "".to_string(),
                                            false => format!(
                                                r#", {{
{content}
{base_indent}    }}"#
                                            )
                                        }
                                    }
                            )
                        })
                        .collect::<Vec<_>>()
                        .join("\n")
                )),
                (!namespace.pubsub_items.is_empty()).then(|| format!(
                    r#"{base_indent}  pubsub = {{
{}
{base_indent}  }};"#,
                    namespace
                        .pubsub_items
                        .iter()
                        .map(|(name, item)| {
                            let payload = type_item_to_code(&item.payload, level + 1);
                            format!(
                                "{base_indent}    {name}: this.getPubsubItem{key}{api}>(\"{name}\"),",
                                key = match &item.key {
                                    None => format!("NoKey<{payload}, "),
                                    Some(key) => {
                                        let key = type_item_to_code(key, level + 1);
                                        format!("<{key}, {payload}, ")
                                    }
                                },
                                api = ALL_PUBSUB_OPERATIONS
                                    .iter()
                                    .map(|x| match item.expose.contains(x) {
                                        true => "true",
                                        false => "false",
                                    })
                                    .collect::<Vec<_>>()
                                    .join(", ")
                            )
                        })
                        .collect::<Vec<_>>()
                        .join("\n")
                )),
                (!namespace.task_items.is_empty()).then(|| format!(
                    r#"{base_indent}  task = {{
{}
{base_indent}  }};"#,
                    namespace
                        .task_items
                        .iter()
                        .map(|(name, item)| {
                            let payload = type_item_to_code(&item.payload, level + 1);
                            format!(
                                "{base_indent}    {name}: this.getTaskItem{key}{api}>(\"{name}\"{options}),",
                                key = match &item.key {
                                    None => format!("NoKey<{payload}, "),
                                    Some(key) => {
                                        let key = type_item_to_code(key, level + 1);
                                        format!("<{key}, {payload}, ")
                                    }
                                },
                                api = ALL_TASK_OPERATIONS
                                    .iter()
                                    .map(|x| match item.expose.contains(x) {
                                        true => "true",
                                        false => "false",
                                    })
                                    .collect::<Vec<_>>()
                                    .join(", "),
                                    options = {
                                        let content = [
                                            item.queue_type.as_ref().map(|x| format!(
                                                "{base_indent}      queueType: {},",value_to_code(x))),
                                        ]
                                        .into_iter()
                                        .flatten()
                                        .collect::<Vec<_>>()
                                        .join("\n");
                                        match content.is_empty() {
                                            true => "".to_string(),
                                            false => format!(
                                                r#", {{
{content}
{base_indent}    }}"#
                                            )
                                        }
                                    }
                            )
                        })
                        .collect::<Vec<_>>()
                        .join("\n")
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
        .join("\n\n"),
    ));
    result
}

pub fn codegen(export_schema: &ExportSchema) -> String {
    format!(
        r#"// deno-fmt-ignore-file
// deno-lint-ignore-file
/* eslint-disable */
import {{ MemorixBase, getEnvVariable }} from "@memorix/client-redis";

{}"#,
        namespace_to_code(
            &export_schema.global_namespace,
            vec![],
            &export_schema.engine,
        )
    )
    .to_string()
}
