use crate::{
    export_schema::{
        ExportCacheItem, ExportNamespace, ExportPubSubItem, ExportSchema, ExportTaskItem,
    },
    parser::{Engine, TypeItem},
};

#[derive(Debug, PartialEq, Clone)]
pub struct ValidatedSchema {
    pub engine: Engine,
    pub global_namespace: ValidatedNamespace,
}

#[derive(Debug, PartialEq, Clone)]
pub struct ValidatedNamespace {
    pub type_items: Vec<(String, ValidatedTypeItem)>,
    pub enum_items: Vec<(String, Vec<String>)>,
    pub cache_items: Vec<(String, ExportCacheItem<ValidatedTypeItem>)>,
    pub pubsub_items: Vec<(String, ExportPubSubItem<ValidatedTypeItem>)>,
    pub task_items: Vec<(String, ExportTaskItem<ValidatedTypeItem>)>,
    pub namespaces: Vec<(String, ValidatedNamespace)>,
}

#[derive(Debug, PartialEq, Clone)]
pub struct ValidatedReferenceTypeItem {
    pub namespace_indexes: Vec<usize>,
    pub kind: ValidatedReferenceTypeItemKind,
}

#[derive(Debug, PartialEq, Clone)]
pub enum ValidatedReferenceTypeItemKind {
    ToTypeItem(usize),
    ToEnum(usize),
}

#[derive(Debug, PartialEq, Clone)]
pub enum ValidatedTypeItem {
    U32,
    I32,
    U64,
    I64,
    F32,
    F64,
    String,
    Boolean,
    Optional(Box<ValidatedTypeItem>),
    Array(Box<ValidatedTypeItem>),
    Object(Vec<(String, ValidatedTypeItem)>),
    Reference(ValidatedReferenceTypeItem),
}

fn validate_type_item(
    type_item: &TypeItem,
    schema: &ExportSchema,
    namespace_indexes: &[usize],
) -> ValidatedTypeItem {
    match type_item {
        TypeItem::U32 => ValidatedTypeItem::U32,
        TypeItem::I32 => ValidatedTypeItem::I32,
        TypeItem::U64 => ValidatedTypeItem::U64,
        TypeItem::I64 => ValidatedTypeItem::I64,
        TypeItem::F32 => ValidatedTypeItem::F32,
        TypeItem::F64 => ValidatedTypeItem::F64,
        TypeItem::String => ValidatedTypeItem::String,
        TypeItem::Boolean => ValidatedTypeItem::Boolean,
        TypeItem::Optional(x) => {
            ValidatedTypeItem::Optional(Box::new(validate_type_item(x, schema, namespace_indexes)))
        }
        TypeItem::Array(x) => {
            ValidatedTypeItem::Array(Box::new(validate_type_item(x, schema, namespace_indexes)))
        }
        TypeItem::Object(x) => ValidatedTypeItem::Object(
            x.iter()
                .map(|(k, x)| (k.clone(), validate_type_item(x, schema, namespace_indexes)))
                .collect(),
        ),
        TypeItem::Reference(x) => {
            let namespaces = namespace_indexes
                .iter()
                .fold(vec![&schema.global_namespace], |mut acc, &i| {
                    let current_namespace = acc[acc.len() - 1];
                    let child_namespace = &current_namespace.namespaces[i].1;
                    acc.push(child_namespace);
                    acc
                })
                .into_iter()
                .rev()
                .collect::<Vec<_>>();
            let mut current_namespace_indexes = namespace_indexes.to_vec();
            for namespace in namespaces {
                let type_item_index = namespace.type_items.iter().position(|(k, _)| *k == *x);
                match type_item_index {
                    Some(type_item_index) => {
                        return ValidatedTypeItem::Reference(ValidatedReferenceTypeItem {
                            namespace_indexes: current_namespace_indexes,
                            kind: ValidatedReferenceTypeItemKind::ToTypeItem(type_item_index),
                        })
                    }
                    None => {
                        let enum_index = namespace.enum_items.iter().position(|(k, _)| *k == *x);
                        match enum_index {
                            Some(enum_index) => {
                                return ValidatedTypeItem::Reference(ValidatedReferenceTypeItem {
                                    namespace_indexes: current_namespace_indexes,
                                    kind: ValidatedReferenceTypeItemKind::ToEnum(enum_index),
                                })
                            }
                            None => {
                                current_namespace_indexes.pop();
                            }
                        }
                    }
                }
            }
            panic!("Couldn't find type with name \"{}\"", x);
        }
    }
}

fn validate_namespace(
    namespace: &ExportNamespace,
    schema: &ExportSchema,
    namespace_indexes: &[usize],
) -> ValidatedNamespace {
    ValidatedNamespace {
        enum_items: namespace.enum_items.clone(),
        type_items: namespace
            .type_items
            .iter()
            .map(|(k, x)| (k.clone(), validate_type_item(x, schema, namespace_indexes)))
            .collect(),
        cache_items: namespace
            .cache_items
            .iter()
            .map(|(k, x)| {
                (
                    k.clone(),
                    ExportCacheItem {
                        key: x
                            .key
                            .as_ref()
                            .and_then(|y| Some(validate_type_item(y, schema, namespace_indexes))),
                        payload: validate_type_item(&x.payload, schema, namespace_indexes),
                        expose: x.expose.clone(),
                        ttl: x.ttl.clone(),
                        extend_on_get: x.extend_on_get.clone(),
                    },
                )
            })
            .collect(),
        pubsub_items: namespace
            .pubsub_items
            .iter()
            .map(|(k, x)| {
                (
                    k.clone(),
                    ExportPubSubItem {
                        key: x
                            .key
                            .as_ref()
                            .and_then(|y| Some(validate_type_item(y, schema, namespace_indexes))),
                        payload: validate_type_item(&x.payload, schema, namespace_indexes),
                        expose: x.expose.clone(),
                    },
                )
            })
            .collect(),
        task_items: namespace
            .task_items
            .iter()
            .map(|(k, x)| {
                (
                    k.clone(),
                    ExportTaskItem {
                        key: x
                            .key
                            .as_ref()
                            .and_then(|y| Some(validate_type_item(y, schema, namespace_indexes))),
                        payload: validate_type_item(&x.payload, schema, namespace_indexes),
                        expose: x.expose.clone(),
                        queue_type: x.queue_type.clone(),
                    },
                )
            })
            .collect(),
        namespaces: namespace
            .namespaces
            .iter()
            .enumerate()
            .map(|(i, (k, x))| {
                (
                    k.clone(),
                    validate_namespace(
                        x,
                        schema,
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

pub fn validate_schema(schema: &ExportSchema) -> ValidatedSchema {
    ValidatedSchema {
        engine: schema.engine.clone(),
        global_namespace: validate_namespace(&schema.global_namespace, &schema, &vec![]),
    }
}
