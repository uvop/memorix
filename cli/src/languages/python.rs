use crate::flat_schema::FlatExportSchema;

pub fn codegen(flat_export_schema: &FlatExportSchema) -> String {
    let _ = flat_export_schema;
    "python".to_string()
}
