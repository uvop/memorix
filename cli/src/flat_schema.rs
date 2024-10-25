use crate::{
    export_schema::{ExportCacheItem, ExportPubSubItem, ExportTaskItem},
    parser::Engine,
    validate::{
        ValidatedNamespace, ValidatedReferenceTypeItem, ValidatedSchema, ValidatedTypeItem,
    },
};

#[derive(Debug, PartialEq, Clone)]
pub struct FlatValidatedSchema {
    pub engine: Engine,
    pub global_namespace: FlatValidatedNamespace,
}

#[derive(Debug, PartialEq, Clone)]
pub struct FlatValidatedNamespace {
    pub type_item_objects: Vec<(String, TypeItemObject)>,
    pub flat_type_items: Vec<(String, FlatValidatedTypeItem)>,
    pub enum_items: Vec<(String, Vec<String>)>,
    pub cache_items: Vec<(String, ExportCacheItem<FlatValidatedTypeItem>)>,
    pub pubsub_items: Vec<(String, ExportPubSubItem<FlatValidatedTypeItem>)>,
    pub task_items: Vec<(String, ExportTaskItem<FlatValidatedTypeItem>)>,
    pub namespaces: Vec<(String, FlatValidatedNamespace)>,
}

#[derive(Debug, PartialEq, Clone)]
pub enum FlatValidatedTypeItem {
    U32,
    I32,
    U64,
    I64,
    F32,
    F64,
    String,
    Boolean,
    Optional(Box<FlatValidatedTypeItem>),
    Array(Box<FlatValidatedTypeItem>),
    Reference(ValidatedReferenceTypeItem),
}

#[derive(Debug, PartialEq, Clone)]
pub struct TypeItemObject {
    pub properties: Vec<(String, FlatValidatedTypeItem)>,
}

fn concat_with_key(ctx: &str, key: &str) -> String {
    format!("{}{}", ctx, stringcase::pascal_case(key)).to_string()
}

fn type_item_to_flat_type_items(
    ctx: &str,
    type_item: &ValidatedTypeItem,
) -> (FlatValidatedTypeItem, Vec<(String, TypeItemObject)>) {
    match type_item {
        ValidatedTypeItem::Optional(x) => {
            let (y, hm) = type_item_to_flat_type_items(ctx, x);
            (FlatValidatedTypeItem::Optional(Box::new(y)), hm)
        }
        ValidatedTypeItem::Array(x) => {
            let (y, hm) = type_item_to_flat_type_items(ctx, x);
            (FlatValidatedTypeItem::Array(Box::new(y)), hm)
        }
        ValidatedTypeItem::Object(x) => {
            let sub_props = x
                .iter()
                .map(|(key, x)| {
                    (
                        key.clone(),
                        type_item_to_flat_type_items(&concat_with_key(ctx, key), x),
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

            (FlatValidatedTypeItem::Reference(ctx.to_string()), to_add)
        }
        ValidatedTypeItem::Reference(x) => {
            (FlatValidatedTypeItem::Reference(x.clone()), Vec::new())
        }
        ValidatedTypeItem::U32 => (FlatValidatedTypeItem::U32, Vec::new()),
        ValidatedTypeItem::I32 => (FlatValidatedTypeItem::I32, Vec::new()),
        ValidatedTypeItem::U64 => (FlatValidatedTypeItem::U64, Vec::new()),
        ValidatedTypeItem::I64 => (FlatValidatedTypeItem::I64, Vec::new()),
        ValidatedTypeItem::F32 => (FlatValidatedTypeItem::F32, Vec::new()),
        ValidatedTypeItem::F64 => (FlatValidatedTypeItem::F64, Vec::new()),
        ValidatedTypeItem::String => (FlatValidatedTypeItem::String, Vec::new()),
        ValidatedTypeItem::Boolean => (FlatValidatedTypeItem::Boolean, Vec::new()),
    }
}

fn namespace_to_flat_namespace(namespace: &ValidatedNamespace) -> FlatValidatedNamespace {
    let type_items = namespace
        .type_items
        .iter()
        .map(|(k, t)| {
            let (flat_type_item, type_object_items) =
                type_item_to_flat_type_items(&concat_with_key("InlineType", k), t);
            (k, flat_type_item, type_object_items)
        })
        .collect::<Vec<_>>();
    let cache_items = namespace
        .cache_items
        .iter()
        .map(|(k, item)| {
            let (payload_flat_type_item, payload_type_object_items) = type_item_to_flat_type_items(
                &concat_with_key("InlineCachePayload", k),
                &item.payload,
            );
            let key = item
                .key
                .as_ref()
                .map(|x| type_item_to_flat_type_items(&concat_with_key("InlineCacheKey", k), x));

            let type_object_items = match key.clone() {
                None => payload_type_object_items,
                Some((_, key_type_object_items)) => key_type_object_items
                    .into_iter()
                    .chain(payload_type_object_items)
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
                &concat_with_key("InlinePubSubPayload", k),
                &item.payload,
            );
            let key = item
                .key
                .as_ref()
                .map(|x| type_item_to_flat_type_items(&concat_with_key("InlinePubSubKey", k), x));

            let type_object_items = match key.clone() {
                None => payload_type_object_items,
                Some((_, key_type_object_items)) => key_type_object_items
                    .into_iter()
                    .chain(payload_type_object_items)
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
                &concat_with_key("InlineTaskPayload", k),
                &item.payload,
            );
            let key = item
                .key
                .as_ref()
                .map(|x| type_item_to_flat_type_items(&concat_with_key("InlineTaskKey", k), x));

            let type_object_items = match key.clone() {
                None => payload_type_object_items,
                Some((_, key_type_object_items)) => key_type_object_items
                    .into_iter()
                    .chain(payload_type_object_items)
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

    FlatValidatedNamespace {
        type_item_objects: type_object_items,
        namespaces: namespace
            .namespaces
            .iter()
            .map(|(k, item)| (k.clone(), namespace_to_flat_namespace(item)))
            .collect(),
        flat_type_items: type_items
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
    }
}

impl FlatValidatedSchema {
    pub fn new(schema: &ValidatedSchema) -> Self {
        Self {
            engine: schema.engine.clone(),
            global_namespace: namespace_to_flat_namespace(&schema.global_namespace),
        }
    }
}
