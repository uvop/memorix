mod python;
mod rust;
mod typescript;

use crate::{
    export_schema::ExportSchema,
    flat_schema::FlatExportSchema,
    parser::{Export, Language},
};
use std::collections::HashMap;

pub fn codegen_per_language(
    export: &Export,
    export_schema: &ExportSchema,
    flat_export_schema: &FlatExportSchema,
) -> HashMap<String, String> {
    export
        .files
        .as_ref()
        .unwrap_or(&vec![])
        .into_iter()
        .map(|file| {
            let path = file.path.to_string();
            let content = match file.language {
                Language::TypeScript => typescript::codegen(&export_schema),
                Language::Python => python::codegen(&flat_export_schema),
                Language::Rust => rust::codegen(&flat_export_schema),
            };
            (path, content)
        })
        .collect()
}
