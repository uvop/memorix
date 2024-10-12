use serde::{Deserialize, Serialize};

use crate::{
    imports::ImportedSchema,
    parser::{
        CacheOperation, Engine, Namespace, NamespaceDefaults, PubSubOperation, TaskOperation,
        TypeItem, Value, ALL_CACHE_OPERATIONS, ALL_PUBSUB_OPERATIONS, ALL_TASK_OPERATIONS,
    },
};

#[derive(Debug, PartialEq, Serialize, Deserialize)]
pub struct ExportSchema {
    pub engine: Engine,
    pub global_namespace: ExportNamespace<TypeItem>,
}

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct ExportNamespace<T> {
    pub defaults: NamespaceDefaults,
    pub type_items: Vec<(String, T)>,
    pub enum_items: Vec<(String, Vec<String>)>,
    pub cache_items: Vec<(String, ExportCacheItem<T>)>,
    pub pubsub_items: Vec<(String, ExportPubSubItem<T>)>,
    pub task_items: Vec<(String, ExportTaskItem<T>)>,
    pub namespaces: Vec<(String, ExportNamespace<T>)>,
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

fn namespace_to_export_namespace(
    namespace: &Namespace,
    expose_all: bool,
) -> ExportNamespace<TypeItem> {
    ExportNamespace {
        namespaces: namespace
            .namespaces
            .iter()
            .map(|(k, n)| (k.clone(), namespace_to_export_namespace(&n, expose_all)))
            .collect(),
        defaults: namespace.defaults.clone().unwrap_or(NamespaceDefaults {
            cache_ttl: None,
            cache_extend_on_get: None,
            task_queue_type: None,
        }),
        type_items: namespace
            .type_items
            .clone()
            .unwrap_or(vec![])
            .into_iter()
            .collect(),
        enum_items: namespace
            .enum_items
            .clone()
            .and_then(|x| Some(x.items))
            .unwrap_or(vec![])
            .into_iter()
            .map(|x| (x.name, x.values))
            .collect(),
        cache_items: namespace
            .cache_items
            .clone()
            .unwrap_or(vec![])
            .into_iter()
            .filter_map(|(k, x)| {
                (match expose_all {
                    true => Some(ALL_CACHE_OPERATIONS.to_vec()),
                    false => x.public.and_then(|v| match v.len() == 0 {
                        true => None,
                        false => Some(v),
                    }),
                })
                .and_then(|v| {
                    Some((
                        k,
                        ExportCacheItem {
                            key: x.key,
                            payload: x.payload,
                            expose: v,
                            ttl: x.ttl,
                            extend_on_get: x.extend_on_get,
                        },
                    ))
                })
            })
            .collect(),
        pubsub_items: namespace
            .pubsub_items
            .clone()
            .unwrap_or(vec![])
            .into_iter()
            .filter_map(|(k, x)| {
                (match expose_all {
                    true => Some(ALL_PUBSUB_OPERATIONS.to_vec()),
                    false => x.public.and_then(|v| match v.len() == 0 {
                        true => None,
                        false => Some(v),
                    }),
                })
                .and_then(|v| {
                    Some((
                        k,
                        ExportPubSubItem {
                            key: x.key,
                            payload: x.payload,
                            expose: v,
                        },
                    ))
                })
            })
            .collect(),
        task_items: namespace
            .task_items
            .clone()
            .unwrap_or(vec![])
            .into_iter()
            .filter_map(|(k, x)| {
                (match expose_all {
                    true => Some(ALL_TASK_OPERATIONS.to_vec()),
                    false => x.public.and_then(|v| match v.len() == 0 {
                        true => None,
                        false => Some(v),
                    }),
                })
                .and_then(|v| {
                    Some((
                        k,
                        ExportTaskItem {
                            key: x.key,
                            payload: x.payload,
                            expose: v,
                            queue_type: x.queue_type,
                        },
                    ))
                })
            })
            .collect(),
    }
}

impl ExportSchema {
    fn new_global_namespace(
        import_schema: &ImportedSchema,
        is_import: bool,
    ) -> ExportNamespace<TypeItem> {
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
            defaults: global_namespace.defaults,
            type_items: global_namespace
                .type_items
                .into_iter()
                .chain(
                    import_export_schemas
                        .iter()
                        .map(|x| x.type_items.clone())
                        .flatten(),
                )
                .collect(),
            enum_items: global_namespace
                .enum_items
                .into_iter()
                .chain(
                    import_export_schemas
                        .iter()
                        .map(|x| x.enum_items.clone())
                        .flatten(),
                )
                .collect(),
            cache_items: global_namespace
                .cache_items
                .into_iter()
                .chain(
                    import_export_schemas
                        .iter()
                        .map(|x| x.cache_items.clone())
                        .flatten(),
                )
                .collect(),
            pubsub_items: global_namespace
                .pubsub_items
                .into_iter()
                .chain(
                    import_export_schemas
                        .iter()
                        .map(|x| x.pubsub_items.clone())
                        .flatten(),
                )
                .collect(),
            task_items: global_namespace
                .task_items
                .into_iter()
                .chain(
                    import_export_schemas
                        .iter()
                        .map(|x| x.task_items.clone())
                        .flatten(),
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
