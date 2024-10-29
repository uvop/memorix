mod python;
mod rust;
mod typescript;

use crate::{
    flat_schema::FlatValidatedSchema,
    parser::{Export, Language},
    validate::ValidatedSchema,
};
use std::collections::HashMap;

pub fn codegen_per_language(
    export: &Export,
    validated_schema: &ValidatedSchema,
    flat_validated_schema: &FlatValidatedSchema,
) -> HashMap<String, String> {
    export
        .files
        .as_ref()
        .unwrap_or(&vec![])
        .iter()
        .map(|file| {
            let path = file.path.to_string();
            let content = match file.language {
                Language::TypeScript => typescript::codegen(validated_schema),
                Language::Python => python::codegen(flat_validated_schema),
                Language::Rust => rust::codegen(flat_validated_schema),
            };
            (path, content)
        })
        .collect()
}
