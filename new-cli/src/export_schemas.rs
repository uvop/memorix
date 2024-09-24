use serde::{Deserialize, Serialize};

use crate::parser::{Export, Namespace, Schema};

#[derive(Debug, PartialEq, Serialize, Deserialize)]
pub struct ExportSchema {
    pub config: Config,
    pub global_namespace: Namespace,
    pub namespaces: Vec<(String, Namespace)>,
}

#[derive(Debug, PartialEq, Serialize, Deserialize)]
pub struct Config {
    pub export: Export,
}

pub fn get_schemas_to_export(schema: Schema) -> Vec<ExportSchema> {
    let sub_schemas_to_export = schema
        .config
        .import
        .into_iter()
        .map(get_schemas_to_export)
        .flatten()
        .collect::<Vec<_>>();
    let namespaces = schema
        .namespaces
        .into_iter()
        .chain(
            sub_schemas_to_export
                .iter()
                .map(|x| x.namespaces.clone())
                .flatten(),
        )
        .collect::<Vec<_>>();
    let global_namespace = Namespace {
        defaults: schema.global_namespace.defaults,
        type_items: schema
            .global_namespace
            .type_items
            .into_iter()
            .chain(
                sub_schemas_to_export
                    .iter()
                    .map(|x| x.global_namespace.type_items.clone())
                    .flatten(),
            )
            .collect(),
        cache_items: schema
            .global_namespace
            .cache_items
            .into_iter()
            .chain(
                sub_schemas_to_export
                    .iter()
                    .map(|x| x.global_namespace.cache_items.clone())
                    .flatten(),
            )
            .collect(),
        pubsub_items: schema
            .global_namespace
            .pubsub_items
            .into_iter()
            .chain(
                sub_schemas_to_export
                    .iter()
                    .map(|x| x.global_namespace.pubsub_items.clone())
                    .flatten(),
            )
            .collect(),
        task_items: schema
            .global_namespace
            .task_items
            .into_iter()
            .chain(
                sub_schemas_to_export
                    .iter()
                    .map(|x| x.global_namespace.task_items.clone())
                    .flatten(),
            )
            .collect(),
    };

    match schema.config.export {
        Some(export) => {
            let schema_to_export = ExportSchema {
                config: Config { export },
                global_namespace,
                namespaces,
            };
            sub_schemas_to_export
                .into_iter()
                .chain(vec![schema_to_export])
                .collect()
        }
        None => sub_schemas_to_export,
    }
}
