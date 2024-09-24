use serde::{Deserialize, Serialize};

use crate::{
    export_schemas::ExportSchema,
    parser::{CacheItem, Namespace, NamespaceDefaults, PubSubItem, TaskItem, TypeItem},
};

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct FlatSchemaToExport {
    pub global_namespace: FlatNamespace,
    pub namespaces: Vec<(String, FlatNamespace)>,
}

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct FlatNamespace {
    pub type_object_items: Vec<(String, TypeItemObject)>,
    pub defaults: NamespaceDefaults,
    pub type_items: Vec<(String, FlatTypeItem)>,
    pub cache_items: Vec<(String, CacheItem<FlatTypeItem>)>,
    pub pubsub_items: Vec<(String, PubSubItem<FlatTypeItem>)>,
    pub task_items: Vec<(String, TaskItem<FlatTypeItem>)>,
}

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub enum FlatTypeItem {
    U32,
    I32,
    U64,
    I64,
    F32,
    F64,
    String,
    Boolean,
    Array(Box<FlatTypeItem>),
    Reference(String),
}

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct TypeItemObject {
    pub properties: Vec<(String, FlatTypeItem)>,
}

fn concat_with_key(ctx: &str, key: &str) -> String {
    format!("{}{}", ctx, stringcase::pascal_case(&key)).to_string()
}

fn type_item_to_flat_type_items(
    ctx: &str,
    type_item: TypeItem,
) -> (FlatTypeItem, Vec<(String, TypeItemObject)>) {
    match type_item {
        TypeItem::Array(x) => {
            let (y, hm) = type_item_to_flat_type_items(ctx, *x);
            (FlatTypeItem::Array(Box::new(y)), hm)
        }
        TypeItem::Object(x) => {
            let sub_props = x
                .into_iter()
                .map(|(key, x)| {
                    (
                        key.clone(),
                        type_item_to_flat_type_items(&concat_with_key(ctx, &key), x),
                    )
                })
                .collect::<Vec<_>>();
            let to_add = sub_props.iter().cloned().fold(
                Vec::from([(
                    ctx.to_string(),
                    TypeItemObject {
                        properties: sub_props
                            .iter()
                            .cloned()
                            .map(|(k, (t, _))| (k, t))
                            .collect::<Vec<_>>(),
                    },
                )]),
                |mut acc, (_, (_, x))| {
                    acc.extend(x);
                    acc
                },
            );

            (FlatTypeItem::Reference(ctx.to_string()), to_add)
        }
        TypeItem::Reference(x) => (FlatTypeItem::Reference(x), Vec::new()),
        TypeItem::U32 => (FlatTypeItem::U32, Vec::new()),
        TypeItem::I32 => (FlatTypeItem::I32, Vec::new()),
        TypeItem::U64 => (FlatTypeItem::U64, Vec::new()),
        TypeItem::I64 => (FlatTypeItem::I64, Vec::new()),
        TypeItem::F32 => (FlatTypeItem::F32, Vec::new()),
        TypeItem::F64 => (FlatTypeItem::F64, Vec::new()),
        TypeItem::String => (FlatTypeItem::String, Vec::new()),
        TypeItem::Boolean => (FlatTypeItem::Boolean, Vec::new()),
    }
}

fn namespace_to_flat_namespace(namespace: Namespace) -> FlatNamespace {
    let type_items = namespace
        .type_items
        .into_iter()
        .map(|(k, t)| {
            let (flat_type_item, type_object_items) =
                type_item_to_flat_type_items(&concat_with_key("InlineType", &k), t);
            (k, flat_type_item, type_object_items)
        })
        .collect::<Vec<_>>();
    let cache_items = namespace
        .cache_items
        .into_iter()
        .map(|(k, item)| {
            let (payload_flat_type_item, payload_type_object_items) = type_item_to_flat_type_items(
                &concat_with_key("InlineCachePayload", &k),
                item.payload,
            );
            let key = item
                .key
                .map(|x| type_item_to_flat_type_items(&concat_with_key("InlineCacheKey", &k), x));

            let type_object_items = match key.clone() {
                None => payload_type_object_items,
                Some((_, key_type_object_items)) => key_type_object_items
                    .into_iter()
                    .chain(payload_type_object_items.into_iter())
                    .collect(),
            };
            (
                k,
                CacheItem {
                    key: key.map(|(x, _)| x),
                    payload: payload_flat_type_item,
                    public: item.public,
                    ttl: item.ttl,
                },
                type_object_items,
            )
        })
        .collect::<Vec<_>>();
    let pubsub_items = namespace
        .pubsub_items
        .into_iter()
        .map(|(k, item)| {
            let (payload_flat_type_item, payload_type_object_items) = type_item_to_flat_type_items(
                &concat_with_key("InlinePubSubPayload", &k),
                item.payload,
            );
            let key = item
                .key
                .map(|x| type_item_to_flat_type_items(&concat_with_key("InlinePubSubKey", &k), x));

            let type_object_items = match key.clone() {
                None => payload_type_object_items,
                Some((_, key_type_object_items)) => key_type_object_items
                    .into_iter()
                    .chain(payload_type_object_items.into_iter())
                    .collect(),
            };
            (
                k,
                PubSubItem {
                    key: key.map(|(x, _)| x),
                    payload: payload_flat_type_item,
                    public: item.public,
                },
                type_object_items,
            )
        })
        .collect::<Vec<_>>();
    let task_items = namespace
        .task_items
        .into_iter()
        .map(|(k, item)| {
            let (payload_flat_type_item, payload_type_object_items) = type_item_to_flat_type_items(
                &concat_with_key("InlineTaskPayload", &k),
                item.payload,
            );
            let key = item
                .key
                .map(|x| type_item_to_flat_type_items(&concat_with_key("InlineTaskKey", &k), x));

            let type_object_items = match key.clone() {
                None => payload_type_object_items,
                Some((_, key_type_object_items)) => key_type_object_items
                    .into_iter()
                    .chain(payload_type_object_items.into_iter())
                    .collect(),
            };
            (
                k,
                TaskItem {
                    key: key.map(|(x, _)| x),
                    payload: payload_flat_type_item,
                    public: item.public,
                    queue_type: item.queue_type,
                },
                type_object_items,
            )
        })
        .collect::<Vec<_>>();
    let type_object_items = type_items
        .iter()
        .cloned()
        .map(|(_, _, x)| x)
        .chain(cache_items.iter().cloned().map(|(_, _, x)| x))
        .chain(pubsub_items.iter().cloned().map(|(_, _, x)| x))
        .chain(task_items.iter().cloned().map(|(_, _, x)| x))
        .fold(Vec::new(), |mut acc, x| {
            acc.extend(x);
            acc
        });
    FlatNamespace {
        defaults: namespace.defaults,
        type_object_items,
        type_items: type_items
            .into_iter()
            .map(|(k, item, _)| (k, item))
            .collect(),
        cache_items: cache_items
            .into_iter()
            .map(|(k, item, _)| (k, item))
            .collect(),
        pubsub_items: pubsub_items
            .into_iter()
            .map(|(k, item, _)| (k, item))
            .collect(),
        task_items: task_items
            .into_iter()
            .map(|(k, item, _)| (k, item))
            .collect(),
    }
}

pub fn flat_export_schema(export_schema: ExportSchema) -> FlatSchemaToExport {
    FlatSchemaToExport {
        global_namespace: namespace_to_flat_namespace(export_schema.global_namespace),
        namespaces: export_schema
            .namespaces
            .into_iter()
            .map(|(k, n)| (k, namespace_to_flat_namespace(n)))
            .collect(),
    }
}
