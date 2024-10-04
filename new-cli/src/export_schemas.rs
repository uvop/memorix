use serde::{Deserialize, Serialize};

use crate::{
    imports::ImportedSchema,
    parser::{
        CacheOperation, Export, Namespace, NamespaceDefaults, PubSubOperation, TaskOperation,
        TypeItem, Value, ALL_CACHE_OPERATIONS, ALL_PUBSUB_OPERATIONS, ALL_TASK_OPERATIONS,
    },
};

#[derive(Debug, PartialEq, Serialize, Deserialize)]
struct InnerExportSchema {
    global_namespace: ExportNamespace<TypeItem>,
    namespaces: Vec<(String, ExportNamespace<TypeItem>)>,
}

#[derive(Debug, PartialEq, Serialize, Deserialize)]
pub struct ExportSchema {
    pub config: Config,
    pub global_namespace: ExportNamespace<TypeItem>,
    pub namespaces: Vec<(String, ExportNamespace<TypeItem>)>,
}

#[derive(Debug, PartialEq, Serialize, Deserialize)]
pub struct Config {
    pub export: Export,
}

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct ExportNamespace<T> {
    pub defaults: NamespaceDefaults,
    pub type_items: Vec<(String, T)>,
    pub enum_items: Vec<(String, Vec<String>)>,
    pub cache_items: Vec<(String, ExportCacheItem<T>)>,
    pub pubsub_items: Vec<(String, ExportPubSubItem<T>)>,
    pub task_items: Vec<(String, ExportTaskItem<T>)>,
}

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct ExportCacheItem<T> {
    pub key: Option<T>,
    pub payload: T,
    pub ttl: Option<Value>,
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
        defaults: namespace.defaults.clone().unwrap_or(NamespaceDefaults {
            cache_ttl: None,
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

impl InnerExportSchema {
    fn new(import_schema: &ImportedSchema, is_import: bool) -> Self {
        let import_export_schemas = import_schema
            .imports
            .iter()
            .map(|x| InnerExportSchema::new(x, true))
            .collect::<Vec<_>>();

        let namespaces = import_schema
            .schema
            .namespaces
            .iter()
            .map(|(k, x)| (k.clone(), namespace_to_export_namespace(x, !is_import)));
        let namespaces = namespaces
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
                        .map(|x| x.global_namespace.type_items.clone())
                        .flatten(),
                )
                .collect(),
            enum_items: global_namespace
                .enum_items
                .into_iter()
                .chain(
                    import_export_schemas
                        .iter()
                        .map(|x| x.global_namespace.enum_items.clone())
                        .flatten(),
                )
                .collect(),
            cache_items: global_namespace
                .cache_items
                .into_iter()
                .chain(
                    import_export_schemas
                        .iter()
                        .map(|x| x.global_namespace.cache_items.clone())
                        .flatten(),
                )
                .collect(),
            pubsub_items: global_namespace
                .pubsub_items
                .into_iter()
                .chain(
                    import_export_schemas
                        .iter()
                        .map(|x| x.global_namespace.pubsub_items.clone())
                        .flatten(),
                )
                .collect(),
            task_items: global_namespace
                .task_items
                .into_iter()
                .chain(
                    import_export_schemas
                        .iter()
                        .map(|x| x.global_namespace.task_items.clone())
                        .flatten(),
                )
                .collect(),
        };

        Self {
            global_namespace,
            namespaces,
        }
    }
}

impl ExportSchema {
    pub fn new(import_schema: ImportedSchema) -> Option<Self> {
        match import_schema
            .schema
            .config
            .as_ref()
            .and_then(|config| config.export.as_ref())
        {
            Some(export) => {
                let inner_export_schema = InnerExportSchema::new(&import_schema, false);
                let export_schema = ExportSchema {
                    global_namespace: inner_export_schema.global_namespace,
                    namespaces: inner_export_schema.namespaces,
                    config: Config {
                        export: export.clone(),
                    },
                };
                Some(export_schema)
            }
            None => None,
        }
    }
}
