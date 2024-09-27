use nom::{error::convert_error, Finish};

use crate::{
    parser::{Config, Schema},
    parser_tools::FromSdl,
    FileSystem,
};

struct ImportedSchema {
    path: String,
    schema: Schema,
    imports: Vec<ImportedSchema>,
}

impl ImportedSchema {
    pub fn new<F: FileSystem>(
        fs: &F,
        path: &str,
    ) -> Result<Self, Box<dyn std::error::Error + Sync + Send>> {
        let input = fs.read_to_string(path)?;
        println!("Read schema from \"{}\"", path);
        let input = input.as_str();
        let (_, schema) = Schema::from_sdl(input).finish().map_err(|e| {
            let stack = format!("parser feedback:\n{}", convert_error(input, e));
            stack
        })?;
        let config = schema.config.clone();
        Ok(ImportedSchema {
            schema,
            path: path.to_string(),
            imports: config
                .unwrap_or(Config {
                    import: vec![],
                    export: None,
                })
                .import
                .into_iter()
                .map(|x| ImportedSchema::new(fs, &x))
                .collect::<Result<Vec<_>, _>>()?,
        })
    }
}
