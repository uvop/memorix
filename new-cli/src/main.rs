mod export_schemas;
mod flat_schema;
mod parser;

use std::fmt;
use std::fs::File;
use std::io::{self, Read};
use std::path::PathBuf;

pub struct PrettyError<T>(pub T);

impl<T> From<T> for PrettyError<T> {
    fn from(v: T) -> Self {
        Self(v)
    }
}

impl<T: fmt::Display> fmt::Debug for PrettyError<T> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        fmt::Display::fmt(&self.0, f)
    }
}

pub trait FileSystem {
    fn read_to_string(&self, path: &str) -> io::Result<String>;
    fn resolve(
        &self,
        relative_file: &str,
        target_file: &str,
    ) -> Result<String, Box<dyn std::error::Error>>;
}

pub struct RealFileSystem;

impl FileSystem for RealFileSystem {
    fn read_to_string(&self, path: &str) -> io::Result<String> {
        let mut file = File::open(path)?;
        let mut contents = String::new();
        file.read_to_string(&mut contents)?;
        Ok(contents)
    }
    fn resolve(
        &self,
        relative_file: &str,
        target_file: &str,
    ) -> Result<String, Box<dyn std::error::Error>> {
        let path = PathBuf::from(relative_file);
        let new_path = path
            .parent()
            .ok_or("Couldn't get parent of schema".to_string())?
            .join(target_file);
        let abs = new_path.canonicalize()?;
        Ok(abs
            .to_str()
            .ok_or("Couldn't convert path to string")?
            .to_string())
    }
}

fn main() -> Result<(), PrettyError<String>> {
    let args: Vec<String> = std::env::args().collect();
    if args.len() != 2 {
        eprintln!("Usage: {} <path_to_sdl_file>", args[0]);
        std::process::exit(1);
    }

    let file_path = &args[1];
    let path = PathBuf::from(file_path)
        .canonicalize()
        .map_err(|_| "Couldn't get abs path for schema".to_string())?;
    let abs_file_path = path
        .to_str()
        .ok_or("Couldn't get abs path for schema".to_string())?;

    let fs = RealFileSystem {};

    let parsed_schema = crate::parser::Schema::new(&fs, abs_file_path)?;
    let export_schemas = crate::export_schemas::ExportSchema::new_vec(parsed_schema);
    let flat_export_schemas = export_schemas
        .into_iter()
        .map(crate::flat_schema::FlatExportSchema::new)
        .collect::<Vec<_>>();

    println!("{:#?}", flat_export_schemas);

    Ok(())
}

mod tests {
    use std::{collections::HashMap, io};

    use crate::FileSystem;

    pub struct MockFileSystem {
        pub files: HashMap<&'static str, String>,
    }

    impl FileSystem for MockFileSystem {
        fn read_to_string(&self, path: &str) -> io::Result<String> {
            self.files
                .get(path)
                .cloned()
                .ok_or_else(|| io::Error::new(io::ErrorKind::NotFound, "File not found"))
        }
        fn resolve(
            &self,
            _: &str,
            target_file: &str,
        ) -> Result<String, Box<dyn std::error::Error>> {
            Ok(target_file.to_string())
        }
    }

    #[test]
    fn test_parse_example_sdl() -> Result<(), Box<dyn std::error::Error>> {
        let mock_fs = MockFileSystem {
            files: HashMap::from([
                (
                    "another-schema.memorix",
                    r#"
Config {
  export: {
    engine: Redis( env(REDIS_URL) )
    files: [
      {
        language: TypeScript
        path: "memorix.generated.ts"
      }
      {
        language: Python
        path: "memorix_generated.py"
      }
      {
        language: Rust
        path: "memorix_generated.rs"
      }
    ]
  }
}
Type { abc: u32 }
Cache {
  number_of_messages: {
    payload: u32
    public: [get]
  }
  messages: {
    key: string
    payload: string
  }
}
"#
                    .to_string(),
                ),
                (
                    "schema.memorix",
                    r#"
Config {
  import: [
    "another-schema.memorix"
  ]
  export: {
    engine: Redis( env(REDIS_URL) )
    files: [
      {
        language: TypeScript
        path: "memorix.generated.ts"
      }
      {
        language: Python
        path: "memorix_generated.py"
      }
      {
        language: Rust
        path: "memorix_generated.rs"
      }
    ]
  }
}

Namespace MessageService {
    Cache {
        message: {
            key: string
            payload: {
            id: string
            sender_id: UserId
            recipient_id: UserId
            content: string
            timestamp: u64
            }
            public: [get]
        }
    }

    PubSub {
        new_message: {
            key: UserId
            payload: {
            message_id: string
            recipient_id: UserId
            }
            public: [subscribe]
        }
    }

    Task {
        message_processing_tasks: {
            payload: {
                message_id: string
                processing_type: string
                priority: u32
            }
            queue_type: "Fifo"
        }
    }
}

NamespaceDefaults {
  cache_ttl: "3600"
}

Cache {
  user_profile: {
    key: u32
    payload: {
      id: u32
      name: string
      email: string
    }
    public: [get]
  }
  user_session: {
    key: string
    payload: {
      user_id: u32
      session_token: string
      expiry: u64
    }
    ttl: env(USER_SESSION_TTL)
  }
}
  
Namespace UserService {
  NamespaceDefaults {
    cache_ttl: "7200"
    task_queue_type: env(USER_SERVICE_TASK_QUEUE_TYPE)
  }

  Type {
    UserId: u64
  }

  Cache {
    user_profile: {
      key: UserId
      payload: {
        id: UserId
        name: string
        email: string
      }
      public: [get]
    }
    user_session: {
      key: string
      payload: {
        user_id: UserId
        session_token: string
        expiry: u64
      }
      ttl: env(USER_SESSION_TTL)
    }
  }

  PubSub {
    user_activity: {
      key: UserId
      payload: {
        user_id: UserId
        action: string
        timestamp: u64
      }
      public: [subscribe]
    }
  }

  Task {
    user_registration_tasks: {
      payload: {
        user_id: UserId
        email: string
        registration_date: u64
      }
      public: [enqueue get_len]
    }
  }

}

"#
                    .to_string(),
                ),
            ]),
        };

        let parsed_schema = crate::parser::Schema::new(&mock_fs, "schema.memorix")?;
        let export_schemas = crate::export_schemas::ExportSchema::new_vec(parsed_schema);
        let flat_export_schemas = export_schemas
            .into_iter()
            .map(crate::flat_schema::FlatExportSchema::new)
            .collect::<Vec<_>>();
        insta::assert_snapshot!(serde_json::to_string_pretty(&flat_export_schemas)?);

        Ok(())
    }

    #[test]
    fn test_fail_nicely() -> Result<(), Box<dyn std::error::Error>> {
        let mock_fs = MockFileSystem {
            files: HashMap::from([(
                "schema.memorix",
                r#"
Config {
  export: {
    engine: Redis(env(REDIS_URL))
    files: [      {
        language: TypeScript
        path: "memorix.generated.ts"
      }]
  }
}

Type {
  a: [u64 u32]
}

"#
                .to_string(),
            )]),
        };

        let result = crate::parser::Schema::new(&mock_fs, "schema.memorix");
        let err = result.unwrap_err();
        insta::assert_snapshot!(err.to_string());

        Ok(())
    }
}
