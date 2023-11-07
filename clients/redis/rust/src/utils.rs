extern crate serde_json;
use serde_json::{Map, Value};

pub fn hash_key<V>(value: &V) -> Result<String, Box<dyn std::error::Error>>
where
    V: serde::Serialize,
{
    let mut json = serde_json::to_value(value)?;
    sort_json_recursively(&mut json);
    let sorted_json_string = serde_json::to_string(&json)?;
    Ok(sorted_json_string)
}

fn sort_json_recursively(value: &mut Value) {
    match value {
        Value::Object(obj) => {
            let mut sorted_map = Map::new();
            let obj2 = obj.clone();
            let mut keys = obj2.keys().collect::<Vec<_>>();
            keys.sort();
            for key in keys {
                if let Some(val) = obj.remove(key) {
                    sorted_map.insert(key.to_owned(), val);
                }
            }
            *value = Value::Object(sorted_map.clone());
            for (_, v) in sorted_map.iter_mut() {
                sort_json_recursively(v);
            }
        }
        Value::Array(arr) => {
            for v in arr {
                sort_json_recursively(v);
            }
        }
        _ => {}
    }
}
