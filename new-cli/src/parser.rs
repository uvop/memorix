use nom::combinator::{cut, map_res};
use nom::error::{context, ContextError};
use nom::{
    branch::{alt, permutation},
    bytes::complete::{is_not, tag},
    character::complete::{alpha1, alphanumeric1, char, multispace0, multispace1},
    combinator::{map, opt, recognize, value},
    error::{convert_error, ParseError},
    multi::{many0, separated_list0},
    sequence::{delimited, pair, preceded, separated_pair, terminated, tuple},
    Finish, IResult, Parser,
};
use std::collections::HashMap;
use std::fs::File;
use std::io::{self, Read};
use std::path::PathBuf;

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

#[derive(Debug, PartialEq)]
pub struct Schema {
    pub config: Config,
    pub global_namespace: Namespace,
    pub namespaces: HashMap<String, Namespace>,
}

#[derive(Debug, PartialEq)]
pub struct Config {
    pub import: Vec<Schema>,
    pub export: Option<Export>,
}

#[derive(Debug, PartialEq)]
pub struct Export {
    pub engine: Engine,
    pub files: Vec<FileConfig>,
}

#[derive(Debug, PartialEq)]

pub enum Engine {
    Redis(Value),
}

#[derive(Debug, PartialEq)]
pub struct FileConfig {
    pub language: Language,
    pub path: String,
}

#[derive(Debug, PartialEq, Clone)]
pub enum Language {
    TypeScript,
    Python,
    Rust,
}

#[derive(Debug, PartialEq)]
pub struct Namespace {
    pub defaults: NamespaceDefaults,
    pub type_items: HashMap<String, TypeItem>,
    pub cache_items: HashMap<String, CacheItem>,
    pub pubsub_items: HashMap<String, PubSubItem>,
    pub task_items: HashMap<String, TaskItem>,
}

#[derive(Debug, PartialEq)]
pub struct NamespaceDefaults {
    pub cache_ttl: Option<Value>,
    pub task_queue_type: Option<Value>,
}

#[derive(Debug, PartialEq)]
pub struct CacheItem {
    pub key: Option<TypeItem>,
    pub payload: TypeItem,
    pub public: Vec<CacheOperation>,
    pub ttl: Option<Value>,
}

#[derive(Debug, PartialEq)]
pub struct PubSubItem {
    pub key: Option<TypeItem>,
    pub payload: TypeItem,
    pub public: Vec<PubSubOperation>,
}

#[derive(Debug, PartialEq)]
pub struct TaskItem {
    pub key: Option<TypeItem>,
    pub payload: TypeItem,
    pub public: Vec<TaskOperation>,
    pub queue_type: Option<Value>,
}

#[derive(Debug, PartialEq, Clone)]
pub enum Value {
    String(String),
    Env(String),
}

#[derive(Debug, PartialEq, Clone)]
pub enum TypeItem {
    U32,
    I32,
    U64,
    I64,
    F32,
    F64,
    String,
    Boolean,
    Array(Box<TypeItem>),
    Object(HashMap<String, TypeItem>),
    Reference(String),
}

#[derive(Debug, PartialEq, Clone)]
pub enum CacheOperation {
    Get,
    Set,
    Delete,
}

#[derive(Debug, PartialEq, Clone)]
pub enum PubSubOperation {
    Publish,
    Subscribe,
}

#[derive(Debug, PartialEq, Clone)]
pub enum TaskOperation {
    Enqueue,
    Dequeue,
    Empty,
    GetLen,
}

fn hash<
    'a,
    O,
    E: ParseError<&'a str> + ContextError<&'a str>,
    F: FnMut(&'a str) -> IResult<&'a str, O, E>,
>(
    mut item_parser: F,
) -> impl FnMut(&'a str) -> IResult<&'a str, HashMap<String, O>, E> {
    move |input: &'a str| {
        context(
            "hash",
            preceded(
                char('{'),
                cut(terminated(
                    map(
                        separated_list0(
                            multispace1,
                            separated_pair(
                                preceded(multispace0, parse_identifier),
                                cut(tuple((multispace0, char(':')))),
                                preceded(multispace0, &mut item_parser),
                            ),
                        ),
                        |tuple_vec| {
                            tuple_vec
                                .into_iter()
                                .map(|(k, v)| (String::from(k), v))
                                .collect()
                        },
                    ),
                    preceded(multispace0, char('}')),
                )),
            ),
        )
        .parse(input)
    }
}

macro_rules! hash_known_keys {
    ($(($key:ident, $parser:expr, $required:tt)),+) => {
        preceded(
            char('{'),
            cut(terminated(
                permutation((
                    $(
                        {
                            let parser = preceded(
                                tuple((multispace0, tag(stringify!($key)), multispace0, char(':'), multispace0)),
                                cut($parser)
                            );
                            hash_known_keys!(@field $key, parser, $required)
                        },
                    )+
                )),
                preceded(multispace0, char('}'))
            ))
        )
    };
    (@field $key:ident, $parser:expr, true) => {
        context(concat!("Missing required key \"", stringify!($key), "\""), $parser)
    };
    (@field $key:ident, $parser:expr, false) => {
        opt($parser)
    };
}

fn array<
    'a,
    O,
    E: ParseError<&'a str> + ContextError<&'a str>,
    F: FnMut(&'a str) -> IResult<&'a str, O, E>,
>(
    mut item_parser: F,
) -> impl FnMut(&'a str) -> IResult<&'a str, Vec<O>, E> {
    move |input: &'a str| {
        context(
            "array",
            preceded(
                tuple((char('['), multispace0)),
                cut(terminated(
                    separated_list0(multispace1, &mut item_parser),
                    preceded(multispace0, char(']')),
                )),
            ),
        )(input)
    }
}

fn parse_cache_operation<'a, E: ParseError<&'a str>>(
    input: &'a str,
) -> IResult<&'a str, CacheOperation, E> {
    alt((
        value(CacheOperation::Get, tag("get")),
        value(CacheOperation::Set, tag("set")),
        value(CacheOperation::Delete, tag("delete")),
    ))(input)
}

fn parse_pubsub_operation<'a, E: ParseError<&'a str>>(
    input: &'a str,
) -> IResult<&'a str, PubSubOperation, E> {
    alt((
        value(PubSubOperation::Publish, tag("publish")),
        value(PubSubOperation::Subscribe, tag("subscribe")),
    ))(input)
}

fn parse_task_operation<'a, E: ParseError<&'a str>>(
    input: &'a str,
) -> IResult<&'a str, TaskOperation, E> {
    alt((
        value(TaskOperation::Enqueue, tag("enqueue")),
        value(TaskOperation::Dequeue, tag("dequeue")),
        value(TaskOperation::GetLen, tag("get_len")),
        value(TaskOperation::Empty, tag("empty")),
    ))(input)
}

fn parse_identifier<'a, E: ParseError<&'a str>>(input: &'a str) -> IResult<&'a str, &str, E> {
    recognize(pair(
        alt((alpha1, tag("_"))),
        many0(alt((alphanumeric1, tag("_")))),
    ))(input)
}

fn parse_primitive_type_config<'a, E: ParseError<&'a str>>(
    input: &'a str,
) -> IResult<&'a str, TypeItem, E> {
    alt((
        value(TypeItem::U32, tag("u32")),
        value(TypeItem::I32, tag("i32")),
        value(TypeItem::U64, tag("u64")),
        value(TypeItem::I64, tag("i64")),
        value(TypeItem::F32, tag("f32")),
        value(TypeItem::F64, tag("f64")),
        value(TypeItem::String, tag("string")),
        value(TypeItem::Boolean, tag("boolean")),
    ))(input)
}

fn parse_language<'a, E: ParseError<&'a str> + ContextError<&'a str>>(
    input: &'a str,
) -> IResult<&'a str, Language, E> {
    alt((
        value(Language::TypeScript, tag("TypeScript")),
        value(Language::Python, tag("Python")),
        value(Language::Rust, tag("Rust")),
    ))(input)
}

fn parse_array_type_config<'a, E: ParseError<&'a str> + ContextError<&'a str>>(
    input: &'a str,
) -> IResult<&'a str, TypeItem, E> {
    context(
        "single type config array",
        map(
            preceded(
                tuple((char('['), multispace0)),
                cut(terminated(
                    parse_type_config,
                    preceded(multispace0, char(']')),
                )),
            ),
            |v| TypeItem::Array(Box::new(v)),
        ),
    )(input)
}

fn parse_object_type_config<'a, E: ParseError<&'a str> + nom::error::ContextError<&'a str>>(
    input: &'a str,
) -> IResult<&'a str, TypeItem, E> {
    map(hash(parse_type_config), |hm| TypeItem::Object(hm))(input)
}

fn parse_reference_type_config<'a, E: ParseError<&'a str>>(
    input: &'a str,
) -> IResult<&'a str, TypeItem, E> {
    map(parse_identifier, |s| TypeItem::Reference(s.to_string()))(input)
}

fn parse_type_config<'a, E: ParseError<&'a str> + nom::error::ContextError<&'a str>>(
    input: &'a str,
) -> IResult<&'a str, TypeItem, E> {
    preceded(
        multispace0,
        alt((
            parse_array_type_config,
            parse_primitive_type_config,
            parse_object_type_config,
            parse_reference_type_config,
        )),
    )(input)
}

fn parse_string<'a, E: ParseError<&'a str> + nom::error::ContextError<&'a str>>(
    input: &'a str,
) -> IResult<&'a str, String, E> {
    map(delimited(char('"'), is_not("\""), char('"')), |s: &str| {
        s.to_string()
    })(input)
}

fn parse_value<'a, E: ParseError<&'a str> + nom::error::ContextError<&'a str>>(
    input: &'a str,
) -> IResult<&'a str, Value, E> {
    alt((
        map(
            preceded(
                tag("env"),
                cut(delimited(
                    tuple((multispace0, char('('), multispace0)),
                    is_not(") \t\r\n"),
                    char(')'),
                )),
            ),
            |s: &str| Value::Env(s.to_string()),
        ),
        map(parse_string, Value::String),
    ))(input)
}

fn parse_engine<'a, E: ParseError<&'a str> + nom::error::ContextError<&'a str>>(
    input: &'a str,
) -> IResult<&'a str, Engine, E> {
    map(
        preceded(
            tag("Redis("),
            cut(terminated(
                delimited(multispace0, parse_value, multispace0),
                char(')'),
            )),
        ),
        |v| Engine::Redis(v),
    )(input)
}

fn parse_namespace<'a, E: ParseError<&'a str> + nom::error::ContextError<&'a str>>(
    input: &'a str,
) -> IResult<&'a str, Namespace, E> {
    map(
        permutation((
            map(
                opt(preceded(
                    tuple((multispace0, tag("NamespaceDefaults"), multispace0)),
                    cut(hash_known_keys!(
                        (cache_ttl, parse_value, false),
                        (task_queue_type, parse_value, false)
                    )),
                )),
                |defaults| match defaults {
                    None => NamespaceDefaults {
                        cache_ttl: None,
                        task_queue_type: None,
                    },
                    Some((cache_ttl, task_queue_type)) => NamespaceDefaults {
                        cache_ttl,
                        task_queue_type,
                    },
                },
            ),
            map(
                opt(preceded(
                    tuple((multispace0, tag("Type"), multispace0)),
                    cut(hash(parse_type_config)),
                )),
                |x| x.unwrap_or(HashMap::new()),
            ),
            map(
                opt(preceded(
                    tuple((multispace0, tag("Cache"), multispace0)),
                    cut(hash(map(
                        hash_known_keys!(
                            (key, parse_type_config, false),
                            (payload, parse_type_config, true),
                            (public, array(parse_cache_operation), false),
                            (ttl, parse_value, false)
                        ),
                        |(key, payload, public, ttl)| CacheItem {
                            key,
                            payload,
                            public: public.unwrap_or(vec![]),
                            ttl,
                        },
                    ))),
                )),
                |x| x.unwrap_or(HashMap::new()),
            ),
            map(
                opt(preceded(
                    tuple((multispace0, tag("PubSub"), multispace0)),
                    cut(hash(map(
                        hash_known_keys!(
                            (key, parse_type_config, false),
                            (payload, parse_type_config, true),
                            (public, array(parse_pubsub_operation), false)
                        ),
                        |(key, payload, public)| PubSubItem {
                            key,
                            payload,
                            public: public.unwrap_or(vec![]),
                        },
                    ))),
                )),
                |x| x.unwrap_or(HashMap::new()),
            ),
            map(
                opt(preceded(
                    tuple((multispace0, tag("Task"), multispace0)),
                    cut(hash(map(
                        hash_known_keys!(
                            (key, parse_type_config, false),
                            (payload, parse_type_config, true),
                            (public, array(parse_task_operation), false),
                            (queue_type, parse_value, false)
                        ),
                        |(key, payload, public, queue_type)| TaskItem {
                            key,
                            payload,
                            public: public.unwrap_or(vec![]),
                            queue_type,
                        },
                    ))),
                )),
                |x| x.unwrap_or(HashMap::new()),
            ),
        )),
        |(defaults, type_items, cache_items, pubsub_items, task_items)| Namespace {
            defaults,
            type_items,
            cache_items,
            pubsub_items,
            task_items,
        },
    )(input)
}

fn parse_named_namespace<'a, E: ParseError<&'a str> + nom::error::ContextError<&'a str>>(
    input: &'a str,
) -> IResult<&'a str, (String, Namespace), E> {
    map(
        preceded(
            tuple((tag("Namespace"), multispace1)),
            cut(terminated(
                pair(
                    terminated(parse_identifier, tuple((multispace0, char('{')))),
                    parse_namespace,
                ),
                tuple((multispace0, char('}'))),
            )),
        ),
        |(name, namespace)| (name.to_string(), namespace),
    )(input)
}

pub fn parse_schema<F: FileSystem>(fs: &F, path: &str) -> Result<Schema, String> {
    let input = fs
        .read_to_string(path)
        .map_err(|_| format!("Couldn't read schema at path \"{}\"", path))?;
    println!("Read schema from \"{}\"", path);
    let input = input.as_str();

    let mut parser = map(
        tuple((
            opt(preceded(
                multispace0,
                map(
                    preceded(
                        tuple((tag("Config"), multispace1)),
                        cut(hash_known_keys!(
                            (
                                import,
                                array(map_res(
                                    map_res(parse_string, |import| fs.resolve(path, &import)),
                                    |import_path| parse_schema(fs, &import_path)
                                )),
                                false
                            ),
                            (
                                export,
                                map(
                                    hash_known_keys!(
                                        (engine, parse_engine, true),
                                        (
                                            files,
                                            array(map(
                                                hash_known_keys!(
                                                    (language, parse_language, true),
                                                    (path, parse_string, true)
                                                ),
                                                |(language, path)| FileConfig { language, path }
                                            )),
                                            true
                                        )
                                    ),
                                    |(engine, files)| Export { engine, files }
                                ),
                                false
                            )
                        )),
                    ),
                    |(import, export)| Config {
                        import: import.unwrap_or(vec![]),
                        export,
                    },
                ),
            )),
            many0(preceded(multispace0, parse_named_namespace)),
            parse_namespace,
            many0(preceded(multispace0, parse_named_namespace)),
        )),
        |(config, named_namespaces, global_namespace, more_named_namespaces)| Schema {
            config: config.unwrap_or(Config {
                import: vec![],
                export: None,
            }),
            global_namespace,
            namespaces: named_namespaces
                .into_iter()
                .chain(more_named_namespaces.into_iter())
                .collect::<HashMap<_, _>>(),
        },
    );
    let (_, schema) = parser(input).finish().map_err(|e| {
        let stack = format!("parser feedback:\n{}", convert_error(input, e));
        stack
    })?;
    Ok(schema)
}

#[cfg(test)]
mod tests {
    use super::*;

    struct MockFileSystem {
        files: HashMap<&'static str, String>,
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
                ("another-schema.memorix", "Type { abc: u32 }".to_string()),
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

        let parsed_schema = parse_schema(&mock_fs, "schema.memorix")?;

        assert_eq!(
            parsed_schema.config.import[0]
                .global_namespace
                .type_items
                .get("abc"),
            Some(&TypeItem::U32)
        );
        let export = parsed_schema.config.export.unwrap();
        assert_eq!(
            export.engine,
            Engine::Redis(Value::Env("REDIS_URL".to_string()))
        );
        assert_eq!(export.files.len(), 3);
        assert_eq!(export.files[0].language, Language::TypeScript);
        assert_eq!(export.files[0].path, "memorix.generated.ts");
        assert_eq!(export.files[1].language, Language::Python);
        assert_eq!(export.files[1].path, "memorix_generated.py");
        assert_eq!(export.files[2].language, Language::Rust);
        assert_eq!(export.files[2].path, "memorix_generated.rs");

        // Check global namespace
        assert_eq!(
            parsed_schema.global_namespace.defaults.cache_ttl,
            Some(Value::String("3600".to_string()))
        );
        assert_eq!(parsed_schema.global_namespace.cache_items.len(), 2);
        assert!(parsed_schema.global_namespace.pubsub_items.is_empty());
        assert!(parsed_schema.global_namespace.task_items.is_empty());

        assert_eq!(parsed_schema.namespaces.len(), 2);

        // Check UserService Namespace
        let user_service = parsed_schema.namespaces.get("UserService").unwrap();
        assert_eq!(
            user_service.defaults.cache_ttl,
            Some(Value::String("7200".to_string()))
        );
        assert_eq!(
            user_service.defaults.task_queue_type,
            Some(Value::Env("USER_SERVICE_TASK_QUEUE_TYPE".to_string()))
        );
        assert_eq!(user_service.type_items.get("UserId"), Some(&TypeItem::U64));

        // Check Cache in UserService
        assert!(user_service.cache_items.contains_key("user_profile"));
        assert!(user_service.cache_items.contains_key("user_session"));
        assert_eq!(
            user_service.cache_items.get("user_profile").unwrap().public,
            vec![CacheOperation::Get]
        );
        assert_eq!(
            user_service.cache_items.get("user_session").unwrap().ttl,
            Some(Value::Env("USER_SESSION_TTL".to_string()))
        );

        // Check PubSub in UserService
        assert!(user_service.pubsub_items.contains_key("user_activity"));
        assert_eq!(
            user_service
                .pubsub_items
                .get("user_activity")
                .unwrap()
                .public,
            vec![PubSubOperation::Subscribe]
        );

        // Check Task in UserService
        assert!(user_service
            .task_items
            .contains_key("user_registration_tasks"));
        assert_eq!(
            user_service
                .task_items
                .get("user_registration_tasks")
                .unwrap()
                .public,
            vec![TaskOperation::Enqueue, TaskOperation::GetLen]
        );

        // Check MessageService Namespace
        let message_service = parsed_schema.namespaces.get("MessageService").unwrap();

        // Check Cache in MessageService
        assert!(message_service.cache_items.contains_key("message"));
        assert_eq!(
            message_service.cache_items.get("message").unwrap().public,
            vec![CacheOperation::Get]
        );

        // Check PubSub in MessageService
        assert!(message_service.pubsub_items.contains_key("new_message"));
        assert_eq!(
            message_service
                .pubsub_items
                .get("new_message")
                .unwrap()
                .public,
            vec![PubSubOperation::Subscribe]
        );

        // Check Task in MessageService
        assert!(message_service
            .task_items
            .contains_key("message_processing_tasks"));
        assert_eq!(
            message_service
                .task_items
                .get("message_processing_tasks")
                .unwrap()
                .queue_type,
            Some(Value::String("Fifo".to_string()))
        );

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

        let result = parse_schema(&mock_fs, "schema.memorix");
        let err = result.unwrap_err();
        insta::assert_snapshot!(err.to_string());

        Ok(())
    }
}
