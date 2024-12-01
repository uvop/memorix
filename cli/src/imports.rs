use std::collections::HashMap;

use crate::{parser::Schema, parser_tools::FromSdl, FileSystem};
use nom::{error::convert_error, Finish};
use serde::{Deserialize, Serialize};

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct ImportedSchema {
    pub path: String,
    pub schema: Schema,
    pub imports: Vec<ImportedSchema>,
}

impl ImportedSchema {
    pub fn new<F: FileSystem>(
        fs: &F,
        path: &str,
        parent_imported_schema_by_path: Option<&mut HashMap<String, ImportedSchema>>,
    ) -> Result<Self, Box<dyn std::error::Error + Sync + Send>> {
        let mut binding = HashMap::new();
        let mut imported_schema_by_path = parent_imported_schema_by_path.unwrap_or(&mut binding);
        let existing_import_schema = imported_schema_by_path.get(&path.to_string());
        if let Some(x) = existing_import_schema {
            return Ok(x.clone());
        }
        let input = fs.read_to_string(path)?;
        let input = input.as_str();
        let (_, schema) = Schema::from_sdl(input).finish().map_err(|e| {
            let stack = format!(
                "parser feedback for file \"{}\":\n{}",
                path,
                convert_error(input, e)
            );
            stack
        })?;
        let config = schema.config.clone();
        let import_schema = ImportedSchema {
            schema,
            path: path.to_string(),
            imports: config
                .and_then(|x| x.import)
                .unwrap_or(vec![])
                .into_iter()
                .map(|x| {
                    ImportedSchema::new(
                        fs,
                        &crate::resolve_path(path, &x.to_string())?,
                        Some(&mut imported_schema_by_path),
                    )
                })
                .collect::<Result<Vec<_>, Box<dyn std::error::Error + Sync + Send>>>()?,
        };

        imported_schema_by_path.insert(path.to_string(), import_schema.clone());
        Ok(import_schema)
    }
}
