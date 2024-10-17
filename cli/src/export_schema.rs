use serde::{Deserialize, Serialize};

use crate::{
    imports::ImportedSchema,
    parser::{
        CacheOperation, Engine, Namespace, PubSubOperation, TaskOperation, TypeItem, Value,
        ALL_CACHE_OPERATIONS, ALL_PUBSUB_OPERATIONS, ALL_TASK_OPERATIONS,
    },
};

#[derive(Debug, PartialEq, Serialize, Deserialize)]
pub struct ExportSchema {
    pub engine: Engine,
    pub global_namespace: ExportNamespace,
}

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct ExportNamespace {
    pub type_items: Vec<(String, TypeItem)>,
    pub enum_items: Vec<(String, Vec<String>)>,
    pub cache_items: Vec<(String, ExportCacheItem<TypeItem>)>,
    pub pubsub_items: Vec<(String, ExportPubSubItem<TypeItem>)>,
    pub task_items: Vec<(String, ExportTaskItem<TypeItem>)>,
    pub namespaces: Vec<(String, ExportNamespace)>,
}

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct ExportCacheItem<T> {
    pub key: Option<T>,
    pub payload: T,
    pub ttl: Option<Value>,
    pub extend_on_get: Option<Value>,
    pub expose: Vec<CacheOperation>,
}
#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct ExportPubSubItem<T> {
    pub key: Option<T>,
    pub payload: T,
    pub expose: Vec<PubSubOperation>,
}
#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct ExportTaskItem<T> {
    pub key: Option<T>,
    pub payload: T,
    pub queue_type: Option<Value>,
    pub expose: Vec<TaskOperation>,
}

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct ItemWithExpose<O> {
    expose: Vec<O>,
}

fn namespace_to_export_namespace(namespace: &Namespace, expose_all: bool) -> ExportNamespace {
    ExportNamespace {
        namespaces: namespace
            .namespaces
            .iter()
            .map(|(k, n)| (k.clone(), namespace_to_export_namespace(n, expose_all)))
            .collect(),
        type_items: namespace
            .type_items
            .clone()
            .unwrap_or_default()
            .into_iter()
            .collect(),
        enum_items: namespace
            .enum_items
            .clone()
            .map(|x| x.items)
            .unwrap_or_default()
            .into_iter()
            .map(|x| (x.name, x.values))
            .collect(),
        cache_items: namespace
            .cache_items
            .clone()
            .unwrap_or_default()
            .into_iter()
            .filter_map(|(k, x)| {
                (match expose_all {
                    true => Some(ALL_CACHE_OPERATIONS.to_vec()),
                    false => x.public.and_then(|v| match v.is_empty() {
                        true => None,
                        false => Some(v),
                    }),
                })
                .map(|v| {
                    (
                        k,
                        ExportCacheItem {
                            key: x.key,
                            payload: x.payload,
                            expose: v,
                            ttl: x.ttl,
                            extend_on_get: x.extend_on_get,
                        },
                    )
                })
            })
            .collect(),
        pubsub_items: namespace
            .pubsub_items
            .clone()
            .unwrap_or_default()
            .into_iter()
            .filter_map(|(k, x)| {
                (match expose_all {
                    true => Some(ALL_PUBSUB_OPERATIONS.to_vec()),
                    false => x.public.and_then(|v| match v.is_empty() {
                        true => None,
                        false => Some(v),
                    }),
                })
                .map(|v| {
                    (
                        k,
                        ExportPubSubItem {
                            key: x.key,
                            payload: x.payload,
                            expose: v,
                        },
                    )
                })
            })
            .collect(),
        task_items: namespace
            .task_items
            .clone()
            .unwrap_or_default()
            .into_iter()
            .filter_map(|(k, x)| {
                (match expose_all {
                    true => Some(ALL_TASK_OPERATIONS.to_vec()),
                    false => x.public.and_then(|v| match v.is_empty() {
                        true => None,
                        false => Some(v),
                    }),
                })
                .map(|v| {
                    (
                        k,
                        ExportTaskItem {
                            key: x.key,
                            payload: x.payload,
                            expose: v,
                            queue_type: x.queue_type,
                        },
                    )
                })
            })
            .collect(),
    }
}

impl ExportSchema {
    fn new_global_namespace(import_schema: &ImportedSchema, is_import: bool) -> ExportNamespace {
        let import_export_schemas = import_schema
            .imports
            .iter()
            .map(|x| Self::new_global_namespace(x, true))
            .collect::<Vec<_>>();

        let global_namespaces = import_schema
            .schema
            .global_namespace
            .namespaces
            .iter()
            .map(|(k, x)| (k.clone(), namespace_to_export_namespace(x, !is_import)));
        let global_namespaces = global_namespaces
            .chain(
                import_export_schemas
                    .iter()
                    .flat_map(|x| x.namespaces.clone()),
            )
            .collect::<Vec<_>>();
        let global_namespace =
            namespace_to_export_namespace(&import_schema.schema.global_namespace, !is_import);
        let global_namespace = ExportNamespace {
            type_items: global_namespace
                .type_items
                .into_iter()
                .chain(
                    import_export_schemas
                        .iter()
                        .flat_map(|x| x.type_items.clone()),
                )
                .collect(),
            enum_items: global_namespace
                .enum_items
                .into_iter()
                .chain(
                    import_export_schemas
                        .iter()
                        .flat_map(|x| x.enum_items.clone()),
                )
                .collect(),
            cache_items: global_namespace
                .cache_items
                .into_iter()
                .chain(
                    import_export_schemas
                        .iter()
                        .flat_map(|x| x.cache_items.clone()),
                )
                .collect(),
            pubsub_items: global_namespace
                .pubsub_items
                .into_iter()
                .chain(
                    import_export_schemas
                        .iter()
                        .flat_map(|x| x.pubsub_items.clone()),
                )
                .collect(),
            task_items: global_namespace
                .task_items
                .into_iter()
                .chain(
                    import_export_schemas
                        .iter()
                        .flat_map(|x| x.task_items.clone()),
                )
                .collect(),
            namespaces: global_namespaces,
        };

        global_namespace
    }
    pub fn new(import_schema: &ImportedSchema) -> Self {
        let global_namespace = Self::new_global_namespace(import_schema, false);
        Self {
            global_namespace,
            engine: import_schema
                .clone()
                .schema
                .config
                .expect("Config must be")
                .export
                .expect("Export must be")
                .engine,
        }
    }
}
