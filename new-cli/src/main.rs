use nom::bytes::complete::take_till;
use nom::{
    branch::{alt, permutation},
    bytes::complete::{is_not, tag, take_until},
    character::complete::{alpha1, alphanumeric1, char, multispace0, multispace1, newline},
    combinator::{eof, map, opt, recognize, rest, value, verify},
    error::{convert_error, ParseError, VerboseError},
    multi::{many0, many1, separated_list0, separated_list1},
    sequence::{delimited, pair, preceded, separated_pair, terminated, tuple},
    Finish, IResult, Parser,
};
use std::cell::RefCell;
use std::collections::HashMap;
use std::fs;
use std::rc::Rc;

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

enum NamespaceFinder {
    Found((String, String)),
    NotFound(String),
}

fn extract_parser<
    'a,
    O,
    E: ParseError<&'a str>,
    F: FnMut(&'a str) -> IResult<&'a str, O, E> + 'static,
>(
    parser: F,
) -> impl FnMut(&'a str) -> IResult<String, O, E> {
    let parser = Rc::new(RefCell::new(parser));
    move |input: &'a str| {
        let mut index = 0;
        while index < input.len() {
            let (remainder, _) = take_till(|_| true)(&input[index..])?;
            if let Ok((after, result)) = parser.borrow_mut()(remainder) {
                let before = &input[0..index];
                let new_input = format!("{}{}", before, after);
                return Ok((new_input, result));
            }
            index += 1;
        }
        Err(nom::Err::Error(E::from_error_kind(
            input,
            nom::error::ErrorKind::Fail,
        )))
    }
}

fn extract_multiple_parser<
    'a,
    O,
    E: ParseError<&'a str>,
    F: FnMut(&'a str) -> IResult<&'a str, O, E> + 'static,
>(
    parser: F,
) -> impl FnMut(&'a str) -> IResult<String, Vec<O>, E> {
    let parser = Rc::new(RefCell::new(parser));
    move |input: &str| {
        let mut results = Vec::new();
        let mut remaining = String::new();
        let mut current = input;

        while !current.is_empty() {
            match parser.borrow_mut()(current) {
                Ok((rest, result)) => {
                    results.push(result);
                    let consumed = current.len() - rest.len();
                    if consumed == 0 {
                        // If nothing was consumed, add the first character to remaining
                        remaining.push(current.chars().next().unwrap());
                        current = &current[1..];
                    } else {
                        current = rest;
                    }
                }
                Err(_) => {
                    // If parsing fails, add the first character to remaining
                    remaining.push(current.chars().next().unwrap());
                    current = &current[1..];
                }
            }
        }

        Ok((remaining, results))
    }
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
            separated_list1(
                multispace1,
                separated_pair(
                    preceded(multispace0, parse_identifier),
                    tuple((multispace0, char(':'))),
                    preceded(multispace0, parse_type_config),
                ),
            ),
            tuple((multispace0, char('}'))),
        ),
        |pairs| TypeItem::Object(pairs.into_iter().map(|(k, v)| (k.to_string(), v)).collect()),
    )(input)
}

fn parse_reference_type_config(input: &str) -> IResult<&str, TypeItem, VerboseError<&str>> {
    map(parse_identifier, |s| TypeItem::Reference(s.to_string()))(input)
}

fn parse_type_config(input: &str) -> IResult<&str, TypeItem, VerboseError<&str>> {
    preceded(
        multispace0,
        alt((
            parse_primitive_type_config,
            parse_array_type_config,
            parse_object_type_config,
            parse_reference_type_config,
        )),
    )(input)
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

fn parse_config(input: &str) -> IResult<&str, Config, VerboseError<&str>> {
    map(
        delimited(
            tuple((tag("Config"), multispace0, char('{'))),
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
        |(import, (engine, files))| Config {
            import: import.unwrap_or(vec![]),
            export: Export { engine, files },
        },
    )(input)
}

fn parse_cache_config(input: &str) -> IResult<&str, CacheItem, VerboseError<&str>> {
    map(
        delimited(
            tuple((multispace0, char('{'), multispace0)),
            permutation((
                opt(preceded(
                    tuple((multispace0, tag("key"), multispace0, char(':'))),
                    parse_type_config,
                )),
                preceded(
                    tuple((multispace0, tag("payload"), multispace0, char(':'))),
                    parse_type_config,
                ),
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
                        separated_list1(multispace1, parse_cache_operation),
                        tuple((multispace0, char(']'))),
                    ),
                )),
                opt(preceded(
                    tuple((multispace0, tag("ttl"), multispace0, char(':'), multispace0)),
                    parse_value,
                )),
            )),
            tuple((multispace0, char('}'))),
        ),
        |(key, payload, public, ttl)| CacheItem {
            key,
            payload,
            public: public.unwrap_or(vec![]),
            ttl,
        },
    )(input)
}

fn parse_pubsub_config(input: &str) -> IResult<&str, PubSubItem, VerboseError<&str>> {
    map(
        delimited(
            tuple((multispace0, char('{'), multispace0)),
            permutation((
                opt(preceded(
                    tuple((multispace0, tag("key"), multispace0, char(':'))),
                    parse_type_config,
                )),
                preceded(
                    tuple((multispace0, tag("payload"), multispace0, char(':'))),
                    parse_type_config,
                ),
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
                        separated_list1(multispace1, parse_pubsub_operation),
                        tuple((multispace0, char(']'))),
                    ),
                )),
            )),
            tuple((multispace0, char('}'))),
        ),
        |(key, payload, public)| PubSubItem {
            key,
            payload,
            public: public.unwrap_or(vec![]),
        },
    )(input)
}

fn parse_task_config(input: &str) -> IResult<&str, TaskItem, VerboseError<&str>> {
    map(
        delimited(
            tuple((multispace0, char('{'), multispace0)),
            permutation((
                opt(preceded(
                    tuple((multispace0, tag("key"), multispace0, char(':'))),
                    parse_type_config,
                )),
                preceded(
                    tuple((multispace0, tag("payload"), multispace0, char(':'))),
                    parse_type_config,
                ),
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
                        separated_list1(multispace1, parse_task_operation),
                        tuple((multispace0, char(']'))),
                    ),
                )),
                opt(preceded(
                    tuple((
                        multispace0,
                        tag("queue_type"),
                        multispace0,
                        char(':'),
                        multispace0,
                    )),
                    parse_value,
                )),
            )),
            tuple((multispace0, char('}'))),
        ),
        |(key, payload, public, queue_type)| TaskItem {
            key,
            payload,
            public: public.unwrap_or(vec![]),
            queue_type,
        },
    )(input)
}

fn parse_namespace(input: &str) -> IResult<&str, Namespace, VerboseError<&str>> {
    map(
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
                tuple((multispace0, tag("Type"), multispace0, char('{'))),
                many1(separated_pair(
                    preceded(multispace0, parse_identifier),
                    tuple((multispace0, char(':'))),
                    parse_type_config,
                )),
                tuple((multispace0, char('}'))),
            )),
            opt(delimited(
                tuple((multispace0, tag("Cache"), multispace0, char('{'))),
                many1(separated_pair(
                    preceded(multispace0, parse_identifier),
                    tuple((multispace0, char(':'))),
                    parse_cache_config,
                )),
                tuple((multispace0, char('}'))),
            )),
            opt(delimited(
                tuple((multispace0, tag("PubSub"), multispace0, char('{'))),
                many1(separated_pair(
                    preceded(multispace0, parse_identifier),
                    tuple((multispace0, char(':'))),
                    parse_pubsub_config,
                )),
                tuple((multispace0, char('}'))),
            )),
            opt(delimited(
                tuple((multispace0, tag("Task"), multispace0, char('{'))),
                many1(separated_pair(
                    preceded(multispace0, parse_identifier),
                    tuple((multispace0, char(':'))),
                    parse_task_config,
                )),
                tuple((multispace0, char('}'))),
            )),
        )),
        |(defaults, types, cache, pubsub, task)| Namespace {
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
                .unwrap_or(vec![])
                .into_iter()
                .map(|(k, v)| (k.to_string(), v))
                .collect(),
            pubsub_items: pubsub
                .unwrap_or(vec![])
                .into_iter()
                .map(|(k, v)| (k.to_string(), v))
                .collect(),
            task_items: task
                .unwrap_or(vec![])
                .into_iter()
                .map(|(k, v)| (k.to_string(), v))
                .collect(),
        },
    )(input)
}

fn parse_named_namespace(input: &str) -> IResult<&str, (String, Namespace), VerboseError<&str>> {
    map(
        pair(
            delimited(
                tuple((tag("Namespace"), multispace1)),
                parse_identifier,
                tuple((multispace0, char('{'))),
            ),
            terminated(parse_namespace, tuple((multispace0, char('}')))),
        ),
        |(name, namespace)| (name.to_string(), namespace),
    )(input)
}

fn parse_schema(input: &str) -> IResult<&str, Schema, VerboseError<&str>> {
    let (remaining, config) = extract_parser(parse_config)(input)?;
    let (remaining, namespaces) =
        extract_multiple_parser(parse_named_namespace)(&remaining).unwrap();
    let (_, global_namespace) = extract_parser(parse_namespace)(&remaining).unwrap();
    // verify(tuple((multispace0, eof)), |_| true)(remaining).unwrap();
    Ok((
        input,
        Schema {
            config,
            global_namespace,
            namespaces: namespaces.into_iter().collect(),
        },
    ))
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

"#;

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
}
