use serde::{Deserialize, Serialize};

use crate::{
    export_schema::{
        ExportCacheItem, ExportNamespace, ExportPubSubItem, ExportSchema, ExportTaskItem,
    },
    parser::{Engine, TypeItem},
};

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct FlatExportSchema {
    pub engine: Engine,
    pub global_namespace: FlatExportNamespace,
}

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct FlatExportNamespace {
    pub type_item_objects: Vec<(String, TypeItemObject)>,
    pub modified_namespace: ExportNamespace<FlatTypeItem>,
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
    Optional(Box<FlatTypeItem>),
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
    type_item: &TypeItem,
) -> (FlatTypeItem, Vec<(String, TypeItemObject)>) {
    match type_item {
        TypeItem::Optional(x) => {
            let (y, hm) = type_item_to_flat_type_items(ctx, x);
            (FlatTypeItem::Optional(Box::new(y)), hm)
        }
        TypeItem::Array(x) => {
            let (y, hm) = type_item_to_flat_type_items(ctx, x);
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
        TypeItem::Reference(x) => (FlatTypeItem::Reference(x.clone()), Vec::new()),
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

fn namespace_to_flat_namespace(namespace: &ExportNamespace<TypeItem>) -> FlatExportNamespace {
    let type_items = namespace
        .type_items
        .iter()
        .map(|(k, t)| {
            let (flat_type_item, type_object_items) =
                type_item_to_flat_type_items(&concat_with_key("InlineType", &k), t);
            (k, flat_type_item, type_object_items)
        })
        .collect::<Vec<_>>();
    let cache_items = namespace
        .cache_items
        .iter()
        .map(|(k, item)| {
            let (payload_flat_type_item, payload_type_object_items) = type_item_to_flat_type_items(
                &concat_with_key("InlineCachePayload", &k),
                &item.payload,
            );
            let key = item
                .key
                .as_ref()
                .map(|x| type_item_to_flat_type_items(&concat_with_key("InlineCacheKey", &k), &x));

            let type_object_items = match key.clone() {
                None => payload_type_object_items,
                Some((_, key_type_object_items)) => key_type_object_items
                    .into_iter()
                    .chain(payload_type_object_items.into_iter())
                    .collect(),
            };
            (
                k,
                ExportCacheItem {
                    key: key.map(|(x, _)| x),
                    payload: payload_flat_type_item,
                    expose: item.expose.clone(),
                    ttl: item.ttl.clone(),
                    extend_on_get: item.extend_on_get.clone(),
                },
                type_object_items,
            )
        })
        .collect::<Vec<_>>();
    let pubsub_items = namespace
        .pubsub_items
        .iter()
        .map(|(k, item)| {
            let (payload_flat_type_item, payload_type_object_items) = type_item_to_flat_type_items(
                &concat_with_key("InlinePubSubPayload", &k),
                &item.payload,
            );
            let key = item
                .key
                .as_ref()
                .map(|x| type_item_to_flat_type_items(&concat_with_key("InlinePubSubKey", &k), &x));

            let type_object_items = match key.clone() {
                None => payload_type_object_items,
                Some((_, key_type_object_items)) => key_type_object_items
                    .into_iter()
                    .chain(payload_type_object_items.into_iter())
                    .collect(),
            };
            (
                k,
                ExportPubSubItem {
                    key: key.map(|(x, _)| x),
                    payload: payload_flat_type_item,
                    expose: item.expose.clone(),
                },
                type_object_items,
            )
        })
        .collect::<Vec<_>>();
    let task_items = namespace
        .task_items
        .iter()
        .map(|(k, item)| {
            let (payload_flat_type_item, payload_type_object_items) = type_item_to_flat_type_items(
                &concat_with_key("InlineTaskPayload", &k),
                &item.payload,
            );
            let key = item
                .key
                .as_ref()
                .map(|x| type_item_to_flat_type_items(&concat_with_key("InlineTaskKey", &k), &x));

            let type_object_items = match key.clone() {
                None => payload_type_object_items,
                Some((_, key_type_object_items)) => key_type_object_items
                    .into_iter()
                    .chain(payload_type_object_items.into_iter())
                    .collect(),
            };
            (
                k,
                ExportTaskItem {
                    key: key.map(|(x, _)| x),
                    payload: payload_flat_type_item,
                    expose: item.expose.clone(),
                    queue_type: item.queue_type.clone(),
                },
                type_object_items,
            )
        })
        .collect::<Vec<_>>();
    let namespaces = namespace
        .namespaces
        .iter()
        .map(|(k, n)| {
            let namespace = namespace_to_flat_namespace(&n);
            (
                k.clone(),
                namespace.modified_namespace,
                namespace.type_item_objects,
            )
        })
        .collect::<Vec<_>>();
    let type_object_items = type_items
        .iter()
        .cloned()
        .map(|(_, _, x)| x)
        .chain(namespaces.iter().cloned().map(|(_, _, x)| x))
        .chain(cache_items.iter().cloned().map(|(_, _, x)| x))
        .chain(pubsub_items.iter().cloned().map(|(_, _, x)| x))
        .chain(task_items.iter().cloned().map(|(_, _, x)| x))
        .fold(Vec::new(), |mut acc, x| {
            acc.extend(x);
            acc
        });

    FlatExportNamespace {
        type_item_objects: type_object_items,
        modified_namespace: ExportNamespace {
            namespaces: namespaces
                .into_iter()
                .map(|(k, item, _)| (k, item))
                .collect(),
            type_items: type_items
                .into_iter()
                .map(|(k, item, _)| (k.clone(), item.clone()))
                .collect(),
            enum_items: namespace.enum_items.clone(),
            cache_items: cache_items
                .into_iter()
                .map(|(k, item, _)| (k.clone(), item.clone()))
                .collect(),
            pubsub_items: pubsub_items
                .into_iter()
                .map(|(k, item, _)| (k.clone(), item.clone()))
                .collect(),
            task_items: task_items
                .into_iter()
                .map(|(k, item, _)| (k.clone(), item.clone()))
                .collect(),
        },
    }
}

impl FlatExportSchema {
    pub fn new(export_schema: &ExportSchema) -> Self {
        Self {
            engine: export_schema.engine.clone(),
            global_namespace: namespace_to_flat_namespace(&export_schema.global_namespace),
        }
    }
}
