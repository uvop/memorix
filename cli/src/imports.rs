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
    ) -> Result<Self, Box<dyn std::error::Error + Sync + Send>> {
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
        Ok(ImportedSchema {
            schema,
            path: path.to_string(),
            imports: config
                .and_then(|x| x.import)
                .unwrap_or(vec![])
                .into_iter()
                .map(|x| {
                    Ok(ImportedSchema::new(
                        fs,
                        &crate::resolve_path(&path, &x.to_string())?,
                    )?)
                })
                .collect::<Result<Vec<_>, Box<dyn std::error::Error + Sync + Send>>>()?,
        })
    }
}
