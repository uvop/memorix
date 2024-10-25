use crate::{
    export_schema::{ExportCacheItem, ExportPubSubItem, ExportTaskItem},
    parser::Engine,
    validate::{
        ValidatedNamespace, ValidatedReferenceTypeItemKind, ValidatedSchema, ValidatedTypeItem,
    },
};

#[derive(Debug, PartialEq, Clone)]
pub struct FlatValidatedSchema {
    pub engine: Engine,
    pub global_namespace: FlatValidatedNamespace,
}

#[derive(Debug, PartialEq, Clone)]
pub struct FlatValidatedNamespace {
    pub type_object_items: Vec<(String, TypeObjectItem)>,
    pub flat_type_items: Vec<(String, FlatValidatedTypeItem)>,
    pub enum_items: Vec<(String, Vec<String>)>,
    pub cache_items: Vec<(String, ExportCacheItem<FlatValidatedTypeItem>)>,
    pub pubsub_items: Vec<(String, ExportPubSubItem<FlatValidatedTypeItem>)>,
    pub task_items: Vec<(String, ExportTaskItem<FlatValidatedTypeItem>)>,
    pub namespaces: Vec<(String, FlatValidatedNamespace)>,
}

#[derive(Debug, PartialEq, Clone)]
pub struct FlatValidatedReferenceTypeItem {
    pub namespace_indexes: Vec<usize>,
    pub kind: FlatValidatedReferenceTypeItemKind,
}

#[derive(Debug, PartialEq, Clone)]
pub enum FlatValidatedReferenceTypeItemKind {
    ToTypeItem(usize),
    ToEnum(usize),
    ToTypeObjectItem(usize),
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
    Reference(FlatValidatedReferenceTypeItem),
}

#[derive(Debug, PartialEq, Clone)]
pub struct TypeObjectItem {
    pub properties: Vec<(String, FlatValidatedTypeItem)>,
}

fn concat_with_key(ctx: &str, key: &str) -> String {
    format!("{}{}", ctx, stringcase::pascal_case(key)).to_string()
}

fn type_item_to_flat_type_items(
    ctx: &str,
    type_item: &ValidatedTypeItem,
    namespace_indexes: &[usize],
    type_item_objects: &mut Vec<(String, TypeObjectItem)>,
) -> FlatValidatedTypeItem {
    match type_item {
        ValidatedTypeItem::Optional(x) => FlatValidatedTypeItem::Optional(Box::new(
            type_item_to_flat_type_items(ctx, x, namespace_indexes, type_item_objects),
        )),
        ValidatedTypeItem::Array(x) => FlatValidatedTypeItem::Array(Box::new(
            type_item_to_flat_type_items(ctx, x, namespace_indexes, type_item_objects),
        )),
        ValidatedTypeItem::Object(x) => {
            let properties = x
                .iter()
                .map(|(key, x)| {
                    (
                        key.clone(),
                        type_item_to_flat_type_items(
                            &concat_with_key(ctx, key),
                            x,
                            namespace_indexes,
                            type_item_objects,
                        ),
                    )
                })
                .collect::<Vec<_>>();
            type_item_objects.push((ctx.to_string(), TypeObjectItem { properties }));
            FlatValidatedTypeItem::Reference(FlatValidatedReferenceTypeItem {
                namespace_indexes: namespace_indexes.to_vec(),
                kind: FlatValidatedReferenceTypeItemKind::ToTypeObjectItem(
                    type_item_objects.len() - 1,
                ),
            })
        }
        ValidatedTypeItem::Reference(x) => {
            FlatValidatedTypeItem::Reference(FlatValidatedReferenceTypeItem {
                namespace_indexes: namespace_indexes.to_vec(),
                kind: match x.kind {
                    ValidatedReferenceTypeItemKind::ToEnum(x) => {
                        FlatValidatedReferenceTypeItemKind::ToEnum(x)
                    }
                    ValidatedReferenceTypeItemKind::ToTypeItem(x) => {
                        FlatValidatedReferenceTypeItemKind::ToTypeItem(x)
                    }
                },
            })
        }
        ValidatedTypeItem::U32 => FlatValidatedTypeItem::U32,
        ValidatedTypeItem::I32 => FlatValidatedTypeItem::I32,
        ValidatedTypeItem::U64 => FlatValidatedTypeItem::U64,
        ValidatedTypeItem::I64 => FlatValidatedTypeItem::I64,
        ValidatedTypeItem::F32 => FlatValidatedTypeItem::F32,
        ValidatedTypeItem::F64 => FlatValidatedTypeItem::F64,
        ValidatedTypeItem::String => FlatValidatedTypeItem::String,
        ValidatedTypeItem::Boolean => FlatValidatedTypeItem::Boolean,
    }
}

fn namespace_to_flat_namespace(
    namespace: &ValidatedNamespace,
    namespace_indexes: &[usize],
) -> FlatValidatedNamespace {
    let mut type_object_items = Vec::<(String, TypeObjectItem)>::new();
    let flat_type_items = namespace
        .type_items
        .iter()
        .map(|(k, x)| {
            (
                k.clone(),
                type_item_to_flat_type_items(
                    &concat_with_key("InlineType", k),
                    x,
                    namespace_indexes,
                    &mut type_object_items,
                ),
            )
        })
        .collect::<Vec<_>>();
    let cache_items = namespace
        .cache_items
        .iter()
        .map(|(k, x)| {
            (
                k.clone(),
                ExportCacheItem {
                    key: x.key.as_ref().and_then(|y| {
                        Some(type_item_to_flat_type_items(
                            &concat_with_key("InlineCacheKey", k),
                            y,
                            namespace_indexes,
                            &mut type_object_items,
                        ))
                    }),
                    payload: type_item_to_flat_type_items(
                        &concat_with_key("InlineCachePayload", k),
                        &x.payload,
                        namespace_indexes,
                        &mut type_object_items,
                    ),
                    expose: x.expose.clone(),
                    ttl: x.ttl.clone(),
                    extend_on_get: x.extend_on_get.clone(),
                },
            )
        })
        .collect::<Vec<_>>();
    let pubsub_items = namespace
        .pubsub_items
        .iter()
        .map(|(k, x)| {
            (
                k.clone(),
                ExportPubSubItem {
                    key: x.key.as_ref().and_then(|y| {
                        Some(type_item_to_flat_type_items(
                            &concat_with_key("InlinePubSubKey", k),
                            y,
                            namespace_indexes,
                            &mut type_object_items,
                        ))
                    }),
                    payload: type_item_to_flat_type_items(
                        &concat_with_key("InlinePubSubPayload", k),
                        &x.payload,
                        namespace_indexes,
                        &mut type_object_items,
                    ),
                    expose: x.expose.clone(),
                },
            )
        })
        .collect::<Vec<_>>();
    let task_items = namespace
        .task_items
        .iter()
        .map(|(k, x)| {
            (
                k.clone(),
                ExportTaskItem {
                    key: x.key.as_ref().and_then(|y| {
                        Some(type_item_to_flat_type_items(
                            &concat_with_key("InlineTaskKey", k),
                            y,
                            namespace_indexes,
                            &mut type_object_items,
                        ))
                    }),
                    payload: type_item_to_flat_type_items(
                        &concat_with_key("InlineTaskPayload", k),
                        &x.payload,
                        namespace_indexes,
                        &mut type_object_items,
                    ),
                    expose: x.expose.clone(),
                    queue_type: x.queue_type.clone(),
                },
            )
        })
        .collect::<Vec<_>>();

    FlatValidatedNamespace {
        enum_items: namespace.enum_items.clone(),
        type_object_items,
        flat_type_items,
        cache_items,
        pubsub_items,
        task_items,
        namespaces: namespace
            .namespaces
            .iter()
            .enumerate()
            .map(|(i, (k, x))| {
                (
                    k.clone(),
                    namespace_to_flat_namespace(
                        x,
                        &namespace_indexes
                            .iter()
                            .cloned()
                            .chain(std::iter::once(i))
                            .collect::<Vec<_>>(),
                    ),
                )
            })
            .collect(),
    }
}

impl FlatValidatedSchema {
    pub fn new(schema: &ValidatedSchema) -> Self {
        Self {
            engine: schema.engine.clone(),
            global_namespace: namespace_to_flat_namespace(&schema.global_namespace, &[]),
        }
    }
}
