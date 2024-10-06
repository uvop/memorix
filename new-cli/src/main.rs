mod export_schema;
mod flat_schema;
mod imports;
mod languages;
mod parser;
mod parser_tools;

use std::error::Error;
use std::fmt;
use std::fs::File;
use std::io::{self, Read, Write};
use std::path::PathBuf;

use languages::codegen_per_language;
use nom::error::convert_error;
use nom::Finish;
use parser::{schema_to_sdl, Schema};
use parser_tools::FromSdl;

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

impl From<Box<dyn Error>> for PrettyError<String> {
    fn from(error: Box<dyn Error>) -> Self {
        PrettyError(error.to_string())
    }
}

impl<T: fmt::Debug + fmt::Display> Error for PrettyError<T> {}

impl<T: fmt::Display> fmt::Display for PrettyError<T> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

pub trait FileSystem {
    fn read_to_string(&self, path: &str) -> io::Result<String>;
    fn write_string(&self, path: &str, content: &str) -> io::Result<()>;
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
    fn write_string(&self, path: &str, content: &str) -> io::Result<()> {
        let mut file = std::fs::OpenOptions::new()
            .write(true)
            .create(true)
            .truncate(true)
            .open(path)?;
        file.write_all(content.as_bytes())?;
        Ok(())
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

pub fn format<F: FileSystem>(
    fs: &F,
    path: &str,
) -> Result<(), Box<dyn std::error::Error + Sync + Send>> {
    let input = fs.read_to_string(path)?;
    let input = input.as_str();
    let (_, schema) = Schema::from_sdl(input).finish().map_err(|e| {
        let stack = format!("parser feedback:\n{}", convert_error(input, e));
        stack
    })?;
    let formatted_input = schema_to_sdl(&schema);
    fs.write_string(path, &formatted_input)?;
    Ok(())
}

pub fn codegen<F: FileSystem>(fs: &F, path: &str) -> Result<(), PrettyError<String>> {
    let parsed_schema =
        crate::imports::ImportedSchema::new(fs, path).map_err(|x| format!("{}", x))?;
    let export_schema = crate::export_schema::ExportSchema::new(&parsed_schema);
    let flat_export_schema = crate::flat_schema::FlatExportSchema::new(&export_schema);
    match &parsed_schema
        .schema
        .config
        .unwrap_or(parser::Config {
            import: None,
            export: None,
        })
        .export
    {
        Some(export) => {
            let generated_code = codegen_per_language(&export, &export_schema, &flat_export_schema);
            generated_code
                .into_iter()
                .map(|(code_path, content)| {
                    println!("Schema \"{}\" has been exported to \"{}\"", path, code_path);
                    fs.write_string(&code_path, &content)
                })
                .collect::<Result<Vec<_>, _>>()
                .map_err(|x| format!("{}", x))?;
        }
        None => {
            println!("Schema \"{}\" has no export", path);
        }
    }
    Ok(())
}

enum Command {
    Format,
    Codegen,
}

fn main() -> Result<(), PrettyError<String>> {
    let args: Vec<String> = std::env::args().collect();
    if args.len() < 3 {
        return Err(format!("Usage: [codegen/format] <path_to_sdl_file>").into());
    }
    let command = match args[1].as_str() {
        "format" => Ok(Command::Format),
        "codegen" => Ok(Command::Codegen),
        x => Err(format!("Unknown command \"{}\"", x)),
    }?;

    let file_paths = &args[2..];
    let abs_file_paths = file_paths
        .into_iter()
        .map(|file_path| {
            let path = PathBuf::from(file_path)
                .canonicalize()
                .map_err(|_| "Couldn't get abs path for schema".to_string())?;
            let abs_file_path = path
                .to_str()
                .ok_or("Couldn't get abs path for schema".to_string())?
                .to_string();
            Ok(abs_file_path)
        })
        .collect::<Result<Vec<_>, PrettyError<String>>>()?;

    let fs = RealFileSystem {};

    let _ = abs_file_paths
        .into_iter()
        .map(|abs_file_path| {
            match command {
                Command::Format => format(&fs, &abs_file_path).map_err(|e| e.to_string())?,
                Command::Codegen => codegen(&fs, &abs_file_path)?,
            }
            Ok(())
        })
        .collect::<Result<Vec<()>, PrettyError<String>>>()?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use std::{cell::RefCell, collections::HashMap, io};

    use crate::{codegen, format, FileSystem};

    pub struct MockFileSystem {
        pub files: RefCell<HashMap<String, String>>,
    }

    impl FileSystem for MockFileSystem {
        fn read_to_string(&self, path: &str) -> io::Result<String> {
            self.files.borrow().get(path).cloned().ok_or_else(|| {
                io::Error::new(
                    io::ErrorKind::NotFound,
                    format!("File \"{}\" not found", path),
                )
            })
        }

        fn write_string(&self, path: &str, content: &str) -> io::Result<()> {
            self.files
                .borrow_mut()
                .insert(path.to_string(), content.to_string());
            Ok(())
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
    fn test_parse_example_sdl() -> Result<(), Box<dyn std::error::Error + Sync + Send>> {
        let mock_fs = MockFileSystem {
            files: RefCell::new(HashMap::from([
                (
                    "another-schema.memorix".to_string(),
                    r#"
Config {
  export: {
    engine: Redis( env(REDIS_URL) )
    files: [
      {
        language: typescript
        path: "memorix.generated.ts"
      }
      {
        language: python
        path: "memorix_generated.py"
      }
      {
        language: rust
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
                    "schema.memorix".to_string(),
                    r#"
Config {
  import: [
    "another-schema.memorix"
  ]
  export: {
    engine: Redis( env(REDIS_URL) )
    files: [
      {
        language: typescript
        path: "memorix.generated.ts"
      }
      {
        language: python
        path: "memorix_generated.py"
      }
      {
        language: rust
        path: "memorix_generated.rs"
      }
    ]
  }
}

Namespace MessageService {
    Enum {
      Operation {
        START
        STOP
      }
    }
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
        action: string?
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
            ])),
        };
        codegen(&mock_fs, "schema.memorix")?;
        let typescript_path = "memorix.generated.ts";
        let typescript_code = mock_fs.read_to_string(typescript_path)?;
        insta::assert_snapshot!(typescript_code);
        let python_path = "memorix_generated.py";
        let python_code = mock_fs.read_to_string(python_path)?;
        insta::assert_snapshot!(python_code);
        let rust_path = "memorix_generated.rs";
        let rust_code = mock_fs.read_to_string(rust_path)?;
        insta::assert_snapshot!(rust_code);
        Ok(())
    }

    #[test]
    fn test_fail_nicely() -> Result<(), Box<dyn std::error::Error>> {
        let mock_fs = MockFileSystem {
            files: RefCell::new(HashMap::from([(
                "schema.memorix".to_string(),
                r#"
Config {
  export: {
    engine: Redis(env(REDIS_URL))
    files: [      {
        language: typescript
        path: "memorix.generated.ts"
      }]
  }
}

Type {
  a: [u64 u32]
}

"#
                .to_string(),
            )])),
        };

        let result = codegen(&mock_fs, "schema.memorix");
        let err = result.unwrap_err();
        insta::assert_snapshot!(err.to_string());

        Ok(())
    }
    #[test]
    fn test_format() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let mock_fs = MockFileSystem {
            files: RefCell::new(HashMap::from([(
                "schema.memorix".to_string(),
                r#"
    Config{
      export: {
        engine: Redis(env(REDIS_URL))
        files: [      {
            language: typescript
            path: "memorix.generated.ts"
          }]
      }
    }
    Namespace Science {
      Cache {
        how_many_atoms: {
          payload: u32
          key: u64
          ttl:   env(  TTL_HOW_MANY_ATOMS  )
        }
      }
      PubSub {
        how_many_atoms: {
          payload: {id : u32 number: u64}
        }
        how_many_atoms_2: {
          payload: [{id : u32 number: u64}]
        }
      }
    }
    Namespace Rocket {
      Cache {
        launched: {
          payload: boolean
        }
      }
      Enum {
        Operation {
          START
          STOP
        }
        Color {
          RED
          GREEN
          BLUE
        }
      }
      Namespace aa {
        Cache {
          bb: {
            payload:boolean
          }
        }
      }
      PubSub {
        launched: {
          payload: boolean   ?
        }
      }
    }
    Type {
      a: [u64      ]
    }
    "#
                .to_string(),
            )])),
        };
        format(&mock_fs, "schema.memorix")?;
        let formatted_schema = mock_fs.read_to_string("schema.memorix")?;
        insta::assert_snapshot!(formatted_schema);

        Ok(())
    }
}
