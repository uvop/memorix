use serde::{Deserialize, Serialize};

use crate::parser::{
    CacheItem, CacheOperation, Export, Namespace, NamespaceDefaults, PubSubItem, PubSubOperation,
    Schema, TaskItem, TaskOperation, TypeItem, ALL_CACHE_OPERATIONS, ALL_PUBSUB_OPERATIONS,
    ALL_TASK_OPERATIONS,
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
    pub cache_items: Vec<(String, CacheItem<T, ItemWithExpose<CacheOperation>>)>,
    pub pubsub_items: Vec<(String, PubSubItem<T, ItemWithExpose<PubSubOperation>>)>,
    pub task_items: Vec<(String, TaskItem<T, ItemWithExpose<TaskOperation>>)>,
}

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct ItemWithExpose<O> {
    expose: Vec<O>,
}

fn namespace_to_export_namespace(
    namespace: Namespace,
    expose_all: bool,
) -> ExportNamespace<TypeItem> {
    ExportNamespace {
        defaults: namespace.defaults,
        type_items: namespace.type_items.into_iter().collect(),
        cache_items: namespace
            .cache_items
            .into_iter()
            .filter(|(_, x)| expose_all || x.more.public.len() != 0)
            .map(|(k, x)| {
                (
                    k,
                    CacheItem {
                        key: x.key,
                        payload: x.payload,
                        ttl: x.ttl,
                        more: ItemWithExpose {
                            expose: match expose_all {
                                true => ALL_CACHE_OPERATIONS.to_vec(),
                                false => x.more.public,
                            },
                        },
                    },
                )
            })
            .collect(),
        pubsub_items: namespace
            .pubsub_items
            .into_iter()
            .filter(|(_, x)| expose_all || x.more.public.len() != 0)
            .map(|(k, x)| {
                (
                    k,
                    PubSubItem {
                        key: x.key,
                        payload: x.payload,
                        more: ItemWithExpose {
                            expose: match expose_all {
                                true => ALL_PUBSUB_OPERATIONS.to_vec(),
                                false => x.more.public,
                            },
                        },
                    },
                )
            })
            .collect(),
        task_items: namespace
            .task_items
            .into_iter()
            .filter(|(_, x)| expose_all || x.more.public.len() != 0)
            .map(|(k, x)| {
                (
                    k,
                    TaskItem {
                        key: x.key,
                        payload: x.payload,
                        queue_type: x.queue_type,
                        more: ItemWithExpose {
                            expose: match expose_all {
                                true => ALL_TASK_OPERATIONS.to_vec(),
                                false => x.more.public,
                            },
                        },
                    },
                )
            })
            .collect(),
    }
}

impl InnerExportSchema {
    fn new(schema: Schema, is_import: bool) -> Self {
        let import_export_schemas = schema
            .config
            .import
            .into_iter()
            .map(|x| InnerExportSchema::new(x, true))
            .collect::<Vec<_>>();
        let namespaces = schema
            .namespaces
            .into_iter()
            .map(|(k, x)| (k, namespace_to_export_namespace(x, !is_import)));
        let namespaces = namespaces
            .chain(
                import_export_schemas
                    .iter()
                    .flat_map(|x| x.namespaces.clone()),
            )
            .collect::<Vec<_>>();
        let global_namespace = namespace_to_export_namespace(schema.global_namespace, !is_import);
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
    pub fn new_vec(schema: Schema) -> Vec<Self> {
        let schema_clone = schema.clone();
        schema
            .config
            .import
            .into_iter()
            .flat_map(ExportSchema::new_vec)
            .chain(
                match schema.config.export {
                    Some(export) => {
                        let inner_export_schema = InnerExportSchema::new(schema_clone, false);
                        let export_schema = ExportSchema {
                            global_namespace: inner_export_schema.global_namespace,
                            namespaces: inner_export_schema.namespaces,
                            config: Config { export },
                        };
                        vec![export_schema]
                    }
                    None => vec![],
                }
                .into_iter(),
            )
            .collect()
    }
}
