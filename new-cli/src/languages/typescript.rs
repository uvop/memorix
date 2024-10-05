use crate::export_schema::ExportSchema;

pub fn codegen(export_schema: &ExportSchema) -> String {
    let _ = export_schema;
    "typescript".to_string()
}
