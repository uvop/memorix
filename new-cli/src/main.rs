use nom::{
    branch::{alt, permutation},
    bytes::complete::{is_not, tag},
    character::complete::{alpha1, alphanumeric1, char, multispace0, newline},
    combinator::{map, opt, recognize, value},
    error::{convert_error, VerboseError},
    multi::{many0, many1, separated_list0, separated_list1},
    sequence::{delimited, pair, preceded, separated_pair, terminated, tuple},
    Finish, IResult,
};
use std::collections::HashMap;
use std::fs;

#[derive(Debug, PartialEq)]
struct Schema {
    config: Config,
    global_namespace: Namespace,
    namespaces: HashMap<String, Namespace>,
}

#[derive(Debug, PartialEq)]
struct Config {
    import: Vec<String>,
    export: Export,
}

#[derive(Debug, PartialEq)]
struct Export {
    engine: Engine,
    files: Vec<FileConfig>,
}

#[derive(Debug, PartialEq)]
enum Engine {
    Redis(Value),
}

#[derive(Debug, PartialEq)]
struct FileConfig {
    language: Language,
    file: String,
}

#[derive(Debug, PartialEq, Clone)]
enum Language {
    TypeScript,
    Python,
    Rust,
}

#[derive(Debug, PartialEq)]
struct Namespace {
    defaults: NamespaceDefaults,
    type_items: HashMap<String, TypeItem>,
    cache_items: HashMap<String, CacheItem>,
    pubsub_items: HashMap<String, PubSubItem>,
    task_items: HashMap<String, TaskItem>,
}

#[derive(Debug, PartialEq)]
struct NamespaceDefaults {
    cache_ttl: Option<Value>,
    task_queue_type: Option<Value>,
}

#[derive(Debug, PartialEq)]
struct CacheItem {
    key: Option<TypeItem>,
    payload: TypeItem,
    public: Vec<CacheOperation>,
    ttl: Option<Value>,
}

#[derive(Debug, PartialEq)]
struct PubSubItem {
    key: Option<TypeItem>,
    payload: TypeItem,
    public: Vec<PubSubOperation>,
}

#[derive(Debug, PartialEq)]
struct TaskItem {
    key: Option<TypeItem>,
    payload: TypeItem,
    public: Vec<TaskOperation>,
    queue_type: Option<Value>,
}

#[derive(Debug, PartialEq)]
enum Value {
    String(String),
    Env(String),
}

#[derive(Debug, PartialEq, Clone)]
enum TypeItem {
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
enum CacheOperation {
    Get,
    Set,
    Delete,
}

#[derive(Debug, PartialEq, Clone)]
enum PubSubOperation {
    Publish,
    Subscribe,
}

#[derive(Debug, PartialEq, Clone)]
enum TaskOperation {
    Enqueue,
    Dequeue,
    Empty,
    GetLen,
}

fn parse_cache_operation(input: &str) -> IResult<&str, CacheOperation, VerboseError<&str>> {
    alt((
        value(CacheOperation::Get, tag("get")),
        value(CacheOperation::Set, tag("set")),
        value(CacheOperation::Delete, tag("delete")),
    ))(input)
}

fn parse_pubsub_operation(input: &str) -> IResult<&str, PubSubOperation, VerboseError<&str>> {
    alt((
        value(PubSubOperation::Publish, tag("publish")),
        value(PubSubOperation::Subscribe, tag("subscribe")),
    ))(input)
}

fn parse_task_operation(input: &str) -> IResult<&str, TaskOperation, VerboseError<&str>> {
    alt((
        value(TaskOperation::Enqueue, tag("enqueue")),
        value(TaskOperation::Dequeue, tag("dequeue")),
        value(TaskOperation::GetLen, tag("get_len")),
        value(TaskOperation::Empty, tag("empty")),
    ))(input)
}

// Parser combinators
fn parse_identifier(input: &str) -> IResult<&str, &str, VerboseError<&str>> {
    recognize(pair(
        alt((alpha1, tag("_"))),
        many0(alt((alphanumeric1, tag("_")))),
    ))(input)
}

fn parse_primitive_type_config(input: &str) -> IResult<&str, TypeItem, VerboseError<&str>> {
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

fn parse_language(input: &str) -> IResult<&str, Language, VerboseError<&str>> {
    alt((
        value(Language::TypeScript, tag("TypeScript")),
        value(Language::Python, tag("Python")),
        value(Language::Rust, tag("Rust")),
    ))(input)
}

fn parse_array_type_config(input: &str) -> IResult<&str, TypeItem, VerboseError<&str>> {
    map(
        delimited(
            char('['),
            preceded(multispace0, parse_type_config),
            preceded(multispace0, char(']')),
        ),
        |inner_type| TypeItem::Array(Box::new(inner_type)),
    )(input)
}

fn parse_object_type_config(input: &str) -> IResult<&str, TypeItem, VerboseError<&str>> {
    map(
        delimited(
            char('{'),
            separated_list0(
                preceded(multispace0, char(',')),
                separated_pair(
                    preceded(multispace0, parse_identifier),
                    preceded(multispace0, char(':')),
                    preceded(multispace0, parse_type_config),
                ),
            ),
            preceded(multispace0, char('}')),
        ),
        |pairs| TypeItem::Object(pairs.into_iter().map(|(k, v)| (k.to_string(), v)).collect()),
    )(input)
}

fn parse_reference_type_config(input: &str) -> IResult<&str, TypeItem, VerboseError<&str>> {
    map(parse_identifier, |s| TypeItem::Reference(s.to_string()))(input)
}

fn parse_type_config(input: &str) -> IResult<&str, TypeItem, VerboseError<&str>> {
    alt((
        parse_primitive_type_config,
        parse_array_type_config,
        parse_object_type_config,
        parse_reference_type_config,
    ))(input)
}

fn parse_string(input: &str) -> IResult<&str, String, VerboseError<&str>> {
    map(delimited(char('"'), is_not("\""), char('"')), |s: &str| {
        s.to_string()
    })(input)
}

fn parse_value(input: &str) -> IResult<&str, Value, VerboseError<&str>> {
    alt((
        map(delimited(tag("env("), is_not(")"), char(')')), |s: &str| {
            Value::Env(s.to_string())
        }),
        map(parse_string, Value::String),
    ))(input)
}

fn parse_file_config(input: &str) -> IResult<&str, FileConfig, VerboseError<&str>> {
    map(
        delimited(
            tuple((multispace0, char('{'))),
            tuple((
                preceded(
                    tuple((multispace0, tag("language:"), multispace0)),
                    parse_language,
                ),
                preceded(
                    tuple((multispace0, tag("file:"), multispace0)),
                    parse_string,
                ),
            )),
            tuple((multispace0, char('}'))),
        ),
        |(language, file)| FileConfig { language, file },
    )(input)
}

fn parse_engine(input: &str) -> IResult<&str, Engine, VerboseError<&str>> {
    map(
        preceded(tag("Redis("), terminated(parse_value, char(')'))),
        |v| Engine::Redis(v),
    )(input)
}

fn parse_cache_config(input: &str) -> IResult<&str, CacheItem, VerboseError<&str>> {
    println!("parse_cache_config for {}", input);
    map(
        delimited(
            tuple((multispace0, char('{'), multispace0)),
            permutation((
                // opt(preceded(
                //     tuple((multispace0, tag("key"), multispace0, char(':'), multispace0)),
                //     parse_type_config,
                // )),
                // preceded(
                //     tuple((
                //         multispace0,
                //         tag("payload"),
                //         multispace0,
                //         char(':'),
                //         multispace0,
                //     )),
                //     parse_type_config,
                // ),
                opt(preceded(
                    tuple((
                        multispace0,
                        tag("public"),
                        multispace0,
                        char(':'),
                        multispace0,
                    )),
                    delimited(
                        tuple((char('['), multispace0)),
                        separated_list0(
                            delimited(multispace0, char(','), multispace0),
                            parse_cache_operation,
                        ),
                        tuple((multispace0, char(']'))),
                    ),
                )),
                opt(preceded(
                    tuple((multispace0, tag("ttl"), multispace0, char(':'), multispace0)),
                    parse_value,
                )),
            )),
            tuple((multispace0, char('}'), multispace0)),
        ),
        |(public, ttl)| {
            // |(key, payload, public, ttl)| {
            println!("DID it");
            CacheItem {
                key: None,
                payload: TypeItem::F32,
                public: public.unwrap_or(vec![]),
                ttl,
            }
        },
    )(input)
}

fn parse_namespace(input: &str) -> IResult<&str, Namespace, VerboseError<&str>> {
    map(
        delimited(
            multispace0,
            permutation((
                opt(delimited(
                    tuple((
                        multispace0,
                        tag("NamespaceDefaults"),
                        multispace0,
                        char('{'),
                    )),
                    permutation((
                        opt(preceded(
                            tuple((
                                multispace0,
                                tag("cache_ttl"),
                                multispace0,
                                char(':'),
                                multispace0,
                            )),
                            parse_value,
                        )),
                        opt(preceded(
                            tuple((
                                multispace0,
                                tag("task_queue_type"),
                                multispace0,
                                char(':'),
                                multispace0,
                            )),
                            parse_value,
                        )),
                    )),
                    preceded(multispace0, char('}')),
                )),
                opt(delimited(
                    tuple((multispace0, tag("Types"), multispace0, char('{'))),
                    separated_list0(
                        multispace0,
                        separated_pair(
                            parse_identifier,
                            tuple((multispace0, char(':'), multispace0)),
                            parse_type_config,
                        ),
                    ),
                    tuple((multispace0, char('}'))),
                )),
                opt(delimited(
                    tuple((multispace0, tag("Cache"), multispace0, char('{'))),
                    many1(separated_pair(
                        preceded(multispace0, parse_identifier),
                        tuple((multispace0, char(':'), multispace0)),
                        parse_cache_config,
                    )),
                    tuple((multispace0, char('}'))),
                )),
            )),
            multispace0,
        ),
        |(defaults, types, cache)| Namespace {
            defaults: match defaults {
                None => NamespaceDefaults {
                    cache_ttl: None,
                    task_queue_type: None,
                },
                Some((cache_ttl, task_queue_type)) => NamespaceDefaults {
                    cache_ttl,
                    task_queue_type,
                },
            },
            type_items: types
                .unwrap_or(vec![])
                .into_iter()
                .map(|(k, v)| (k.to_string(), v))
                .collect(),
            cache_items: cache
                .unwrap_or(vec![(
                    "bla",
                    CacheItem {
                        key: None,
                        payload: TypeItem::F32,
                        public: vec![],
                        ttl: None,
                    },
                )])
                .into_iter()
                .map(|(k, v)| (k.to_string(), v))
                .collect(),
            pubsub_items: HashMap::new(),
            task_items: HashMap::new(),
        },
    )(input)
}

fn parse_schema(input: &str) -> IResult<&str, Schema, VerboseError<&str>> {
    map(
        permutation((
            delimited(
                tuple((multispace0, tag("Config"), multispace0, char('{'))),
                permutation((
                    opt(delimited(
                        tuple((
                            multispace0,
                            tag("import"),
                            multispace0,
                            char(':'),
                            multispace0,
                            char('['),
                            multispace0,
                        )),
                        many1(parse_string),
                        tuple((multispace0, char(']'))),
                    )),
                    delimited(
                        tuple((
                            multispace0,
                            tag("export"),
                            multispace0,
                            char(':'),
                            multispace0,
                            char('{'),
                            multispace0,
                        )),
                        permutation((
                            preceded(
                                tuple((
                                    multispace0,
                                    tag("engine"),
                                    multispace0,
                                    char(':'),
                                    multispace0,
                                )),
                                parse_engine,
                            ),
                            delimited(
                                tuple((
                                    multispace0,
                                    tag("files"),
                                    multispace0,
                                    char(':'),
                                    multispace0,
                                    char('['),
                                )),
                                many1(parse_file_config),
                                tuple((multispace0, char(']'))),
                            ),
                        )),
                        tuple((multispace0, char('}'))),
                    ),
                )),
                preceded(multispace0, char('}')),
            ),
            parse_namespace,
            // many0(tuple((
            //     delimited(
            //         tuple((multispace0, tag("Namespace"), multispace0)),
            //         parse_identifier,
            //         tuple((multispace0, char('{'))),
            //     ),
            //     terminated(parse_namespace, tuple((multispace0, char('}')))),
            // ))),
        )),
        // |((import, (engine, files)), global_namespace, namespaces)| Schema {
        |((import, (engine, files)), global_namespace)| Schema {
            config: Config {
                import: import.unwrap_or(vec![]),
                export: Export { engine, files },
            },
            global_namespace,
            namespaces: HashMap::new(),
            // namespaces: namespaces
            //     .into_iter()
            //     .map(|(n, v)| (n.to_string(), v))
            //     .collect(),
        },
    )(input)
}

fn parse_sdl(content: &str) -> Result<Schema, Box<dyn std::error::Error>> {
    let (_, schema) = parse_schema(content).finish().map_err(|e| {
        panic!(
            "verbose errors - `json::<VerboseError<&str>>(data)`:\n{}",
            convert_error(content, e)
        );
        format!(
            "verbose errors - `json::<VerboseError<&str>>(data)`:\n{}",
            convert_error(content, e)
        )
    })?;
    Ok(schema)
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = std::env::args().collect();
    if args.len() != 2 {
        eprintln!("Usage: {} <path_to_sdl_file>", args[0]);
        std::process::exit(1);
    }

    let file_path = &args[1];
    let content = fs::read_to_string(file_path)?;

    let schema = parse_sdl(&content)?;
    println!("{:#?}", schema);

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_example_sdl() -> Result<(), Box<dyn std::error::Error>> {
        let example_sdl = r#"
Config {
  import: [
    "another-schema.memorix"
  ]
  export: {
    engine: Redis(env(REDIS_URL))
    files: [
      {
        language: TypeScript
        file: "memorix.generated.ts"
      }
      {
        language: Python
        file: "memorix_generated.py"
      }
      {
        language: Rust
        file: "memorix_generated.rs"
      }
    ]
  }
}

NamespaceDefaults {
  cache_ttl: "3600"
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

"#;
        // Namespace UserService {
        //   NamespaceDefaults {
        //     cache_ttl: 7200
        //     task_queue_type: env(USER_SERVICE_TASK_QUEUE_TYPE)
        //   }

        //   Types {
        //     UserId: u64
        //   }

        //   Cache {
        //     user_profile: {
        //       key: UserId
        //       payload: {
        //         id: UserId
        //         name: string
        //         email: string
        //       }
        //       public: [get]
        //     }
        //     user_session: {
        //       key: string
        //       payload: {
        //         user_id: UserId
        //         session_token: string
        //         expiry: u64
        //       }
        //       ttl: env(USER_SESSION_TTL)
        //     }
        //   }

        //   PubSub {
        //     user_activity {
        //       key: UserId
        //       payload: {
        //         user_id: UserId
        //         action: string
        //         timestamp: u64
        //       }
        //       public: [subscribe]
        //     }
        //   }

        //   Task {
        //     user_registration_tasks {
        //       payload: {
        //         user_id: UserId
        //         email: string
        //         registration_date: u64
        //       }
        //       public: [queue, get_len]
        //     }
        //   }
        // }

        // Namespace MessageService {
        //   Cache {
        //     message {
        //       key: string
        //       payload: {
        //         id: string
        //         sender_id: UserId
        //         recipient_id: UserId
        //         content: string
        //         timestamp: u64
        //       }
        //       public: [get]
        //     }
        //   }

        //   PubSub {
        //     new_message {
        //       key: UserId
        //       payload: {
        //         message_id: string
        //         recipient_id: UserId
        //       }
        //       public: [subscribe]
        //     }
        //   }

        //   Task {
        //     message_processing_tasks {
        //       payload: {
        //         message_id: string
        //         processing_type: string
        //         priority: u32
        //       }
        //       queue_type: Fifo
        //     }
        //   }
        // }

        let parsed_schema = parse_sdl(example_sdl)?;

        assert_eq!(parsed_schema.config.import, vec!["another-schema.memorix"]);
        assert_eq!(
            parsed_schema.config.export.engine,
            Engine::Redis(Value::Env("REDIS_URL".to_string()))
        );
        assert_eq!(parsed_schema.config.export.files.len(), 3);
        assert_eq!(
            parsed_schema.config.export.files[0].language,
            Language::TypeScript
        );
        assert_eq!(
            parsed_schema.config.export.files[0].file,
            "memorix.generated.ts"
        );
        assert_eq!(
            parsed_schema.config.export.files[1].language,
            Language::Python
        );
        assert_eq!(
            parsed_schema.config.export.files[1].file,
            "memorix_generated.py"
        );
        assert_eq!(
            parsed_schema.config.export.files[2].language,
            Language::Rust
        );
        assert_eq!(
            parsed_schema.config.export.files[2].file,
            "memorix_generated.rs"
        );

        // Check global namespace
        assert_eq!(
            parsed_schema.global_namespace.defaults.cache_ttl,
            Some(Value::String("3600".to_string()))
        );
        assert_eq!(parsed_schema.global_namespace.cache_items.len(), 2);
        assert!(parsed_schema.global_namespace.pubsub_items.is_empty());
        assert!(parsed_schema.global_namespace.task_items.is_empty());

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
        // assert_eq!(
        //     user_service.cache.get("user_profile").unwrap().public,
        //     Some(vec!["get".to_string()])
        // );
        assert_eq!(
            user_service.cache_items.get("user_session").unwrap().ttl,
            Some(Value::Env("USER_SESSION_TTL".to_string()))
        );

        // Check PubSub in UserService
        assert!(user_service.pubsub_items.contains_key("user_activity"));
        // assert_eq!(
        //     user_service.pubsub.get("user_activity").unwrap().public,
        //     Some(vec!["subscribe".to_string()])
        // );

        // Check Task in UserService
        assert!(user_service
            .task_items
            .contains_key("user_registration_tasks"));
        // assert_eq!(
        //     user_service
        //         .task
        //         .get("user_registration_tasks")
        //         .unwrap()
        //         .public,
        //     Some(vec!["queue".to_string(), "get_len".to_string()])
        // );

        // Check MessageService Namespace
        let message_service = parsed_schema.namespaces.get("MessageService").unwrap();

        // Check Cache in MessageService
        assert!(message_service.cache_items.contains_key("message"));
        // assert_eq!(
        //     message_service.cache.get("message").unwrap().public,
        //     Some(vec!["get".to_string()])
        // );

        // Check PubSub in MessageService
        assert!(message_service.pubsub_items.contains_key("new_message"));
        // assert_eq!(
        //     message_service.pubsub.get("new_message").unwrap().public,
        //     Some(vec!["subscribe".to_string()])
        // );

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
}
