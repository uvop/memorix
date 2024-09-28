use crate::{
    create_enum_with_const_slice, impl_from_and_to_sdl_for_enum, impl_from_and_to_sdl_for_struct,
    parser_tools::{indent, FromSdl, ToSdl},
};
use nom::{
    branch::{alt, permutation},
    bytes::complete::{is_not, tag},
    character::complete::{alphanumeric1, char, multispace0, multispace1},
    combinator::{cut, map, opt, value},
    error::{context, ParseError},
    multi::{many0, many_m_n, separated_list1},
    sequence::{delimited, pair, preceded, terminated, tuple},
    IResult,
};
use serde::{Deserialize, Serialize};

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct BracketString(String);

impl BracketString {
    pub fn to_string(&self) -> String {
        self.0.clone()
    }
}

impl FromSdl for BracketString {
    fn from_sdl<'a, E: ParseError<&'a str> + nom::error::ContextError<&'a str>>(
        input: &'a str,
    ) -> IResult<&'a str, Self, E>
    where
        Self: Sized,
    {
        map(delimited(char('"'), is_not("\""), char('"')), |x: &str| {
            BracketString(x.to_string())
        })(input)
    }
}

impl ToSdl for BracketString {
    fn to_sdl(&self, _: usize) -> String {
        format!("\"{}\"", self.0).to_string()
    }
}

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct Schema {
    pub config: Option<Config>,
    pub global_namespace: Namespace,
    pub namespaces: Vec<(String, Namespace)>,
}

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct Config {
    pub import: Option<Vec<BracketString>>,
    pub export: Option<Export>,
}
impl_from_and_to_sdl_for_struct! {
    Config,
    (import: Vec<BracketString>, false),
    (export: Export, false),
}

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct Export {
    pub engine: Engine,
    pub files: Option<Vec<FileConfig>>,
}
impl_from_and_to_sdl_for_struct! {
    Export,
    (engine: Engine, true),
    (files: Vec<FileConfig>, false),
}

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub enum Engine {
    Redis(Value),
}

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct FileConfig {
    pub language: Language,
    pub path: BracketString,
}
impl_from_and_to_sdl_for_struct! {
    FileConfig,
    (language: Language, true),
    (path: BracketString, true),
}

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub enum Language {
    TypeScript,
    Python,
    Rust,
}

impl_from_and_to_sdl_for_enum!(
    Language,
    TypeScript => "typescript",
    Python => "python",
    Rust => "rust"
);

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct Namespace {
    pub defaults: Option<NamespaceDefaults>,
    pub enum_items: Option<EnumItems>,
    pub type_items: Option<Vec<(String, TypeItem)>>,
    pub cache_items: Option<Vec<(String, CacheItem)>>,
    pub pubsub_items: Option<Vec<(String, PubSubItem)>>,
    pub task_items: Option<Vec<(String, TaskItem)>>,
}

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct ItemWithPublic<O> {
    pub public: Vec<O>,
}

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct NamespaceDefaults {
    pub cache_ttl: Option<Value>,
    pub task_queue_type: Option<Value>,
}
impl_from_and_to_sdl_for_struct! {
    NamespaceDefaults,
    (cache_ttl: Value, false),
    (task_queue_type: Value, false),
}

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct EnumItems {
    pub items: Vec<EnumItem>,
}

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct EnumItem {
    pub name: String,
    pub values: Vec<String>,
}

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct CacheItem {
    pub key: Option<TypeItem>,
    pub payload: TypeItem,
    pub ttl: Option<Value>,
    pub public: Option<Vec<CacheOperation>>,
}
impl_from_and_to_sdl_for_struct! {
    CacheItem,
    (key: TypeItem, false),
    (payload: TypeItem, true),
    (ttl: Value, false),
    (public: Vec<CacheOperation>, false),
}

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct PubSubItem {
    pub key: Option<TypeItem>,
    pub payload: TypeItem,
    pub public: Option<Vec<PubSubOperation>>,
}
impl_from_and_to_sdl_for_struct! {
    PubSubItem,
    (key: TypeItem, false),
    (payload: TypeItem, true),
    (public: Vec<PubSubOperation>, false),
}

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct TaskItem {
    pub key: Option<TypeItem>,
    pub payload: TypeItem,
    pub queue_type: Option<Value>,
    pub public: Option<Vec<TaskOperation>>,
}
impl_from_and_to_sdl_for_struct! {
    TaskItem,
    (key: TypeItem, false),
    (payload: TypeItem, true),
    (queue_type: Value, false),
    (public: Vec<TaskOperation>, false),
}

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub enum Value {
    String(String),
    Env(String),
}

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
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
    Object(Vec<(String, TypeItem)>),
    Reference(String),
}

create_enum_with_const_slice! {
#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub enum CacheOperation {
    Get,
    Set,
    Delete,
}
pub ALL_CACHE_OPERATIONS
}

impl_from_and_to_sdl_for_enum!(
    CacheOperation,
    Get => "get",
    Set => "set",
    Delete => "delete"
);

create_enum_with_const_slice! {
#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub enum PubSubOperation {
    Publish,
    Subscribe,
}
pub ALL_PUBSUB_OPERATIONS
}

impl_from_and_to_sdl_for_enum!(
    PubSubOperation,
    Publish => "publish",
    Subscribe => "subscribe",
);

create_enum_with_const_slice! {
#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub enum TaskOperation {
    Enqueue,
    Dequeue,
    Empty,
    GetLen,
}
pub ALL_TASK_OPERATIONS
}

impl_from_and_to_sdl_for_enum!(
    TaskOperation,
    Enqueue => "enqueue",
    Dequeue => "dequeue",
    Empty => "empty",
    GetLen => "get_len"
);

impl FromSdl for TypeItem {
    fn from_sdl<'a, E: ParseError<&'a str> + nom::error::ContextError<&'a str>>(
        input: &'a str,
    ) -> IResult<&'a str, Self, E>
    where
        Self: Sized,
    {
        preceded(
            multispace0,
            alt((
                context(
                    "single type config array",
                    map(
                        preceded(
                            tuple((char('['), multispace0)),
                            cut(terminated(
                                TypeItem::from_sdl,
                                preceded(multispace0, char(']')),
                            )),
                        ),
                        |v| TypeItem::Array(Box::new(v)),
                    ),
                ),
                map(Vec::<(String, TypeItem)>::from_sdl, TypeItem::Object),
                alt((
                    value(TypeItem::U32, tag("u32")),
                    value(TypeItem::I32, tag("i32")),
                    value(TypeItem::U64, tag("u64")),
                    value(TypeItem::I64, tag("i64")),
                    value(TypeItem::F32, tag("f32")),
                    value(TypeItem::F64, tag("f64")),
                    value(TypeItem::String, tag("string")),
                    value(TypeItem::Boolean, tag("boolean")),
                )),
                map(String::from_sdl, TypeItem::Reference),
            )),
        )(input)
    }
}

impl ToSdl for TypeItem {
    fn to_sdl(&self, level: usize) -> String {
        match self {
            Self::U32 => "u32".to_string(),
            Self::U64 => "u64".to_string(),
            Self::I32 => "i32".to_string(),
            Self::I64 => "i64".to_string(),
            Self::F32 => "f32".to_string(),
            Self::F64 => "f64".to_string(),
            Self::Boolean => "boolean".to_string(),
            Self::String => "string".to_string(),
            Self::Reference(x) => x.clone(),
            Self::Array(x) => format!(
                "[\n{}{}\n{}]",
                indent(level + 1),
                x.to_sdl(level + 1),
                indent(level)
            )
            .to_string(),
            Self::Object(x) => x.to_sdl(level + 1),
        }
    }
}

impl FromSdl for Value {
    fn from_sdl<'a, E: ParseError<&'a str> + nom::error::ContextError<&'a str>>(
        input: &'a str,
    ) -> IResult<&'a str, Self, E>
    where
        Self: Sized,
    {
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
            map(delimited(char('"'), is_not("\""), char('"')), |x: &str| {
                Value::String(x.to_string())
            }),
        ))(input)
    }
}

impl ToSdl for Value {
    fn to_sdl(&self, _: usize) -> String {
        match self {
            Self::String(x) => format!("\"{}\"", x).to_string(),
            Self::Env(x) => format!("env({})", x).to_string(),
        }
    }
}

impl FromSdl for Engine {
    fn from_sdl<'a, E: ParseError<&'a str> + nom::error::ContextError<&'a str>>(
        input: &'a str,
    ) -> IResult<&'a str, Self, E>
    where
        Self: Sized,
    {
        map(
            preceded(
                tag("Redis("),
                cut(terminated(
                    delimited(multispace0, Value::from_sdl, multispace0),
                    char(')'),
                )),
            ),
            |v| Engine::Redis(v),
        )(input)
    }
}

impl ToSdl for Engine {
    fn to_sdl(&self, level: usize) -> String {
        match self {
            Self::Redis(x) => format!("Redis({})", x.to_sdl(level)).to_string(),
        }
    }
}

impl FromSdl for EnumItems {
    fn from_sdl<'a, E: ParseError<&'a str> + nom::error::ContextError<&'a str>>(
        input: &'a str,
    ) -> IResult<&'a str, Self, E>
    where
        Self: Sized,
    {
        map(
            delimited(
                tuple((multispace0, char('{'))),
                many0(EnumItem::from_sdl),
                tuple((multispace0, char('}'))),
            ),
            |items| EnumItems { items },
        )(input)
    }
}

impl ToSdl for EnumItems {
    fn to_sdl(&self, level: usize) -> String {
        let level_indent = indent(level);
        let mut result = "{\n".to_string();

        for item in &self.items {
            result.push_str(&format!("{}", item.to_sdl(level + 1)));
        }
        result.push_str(&format!("{}}}", level_indent));

        result
    }
}

impl FromSdl for EnumItem {
    fn from_sdl<'a, E: ParseError<&'a str> + nom::error::ContextError<&'a str>>(
        input: &'a str,
    ) -> IResult<&'a str, Self, E>
    where
        Self: Sized,
    {
        map(
            pair(
                delimited(multispace0, String::from_sdl, multispace1),
                cut(delimited(
                    tuple((multispace0, char('{'), multispace0)),
                    separated_list1(multispace1, alphanumeric1),
                    tuple((multispace0, char('}'))),
                )),
            ),
            |(name, values)| Self {
                name,
                values: values.into_iter().map(|x| x.to_string()).collect(),
            },
        )(input)
    }
}

impl ToSdl for EnumItem {
    fn to_sdl(&self, level: usize) -> String {
        let level_indent = indent(level);
        let next_level_indent = indent(level + 1);
        let mut result = format!("{}{} {{\n", level_indent, self.name).to_string();

        for value in &self.values {
            result.push_str(&format!("{}{}\n", next_level_indent, value));
        }
        result.push_str(&format!("{}}}\n", level_indent));

        result
    }
}

impl FromSdl for Namespace {
    fn from_sdl<'a, E: ParseError<&'a str> + nom::error::ContextError<&'a str>>(
        input: &'a str,
    ) -> IResult<&'a str, Self, E>
    where
        Self: Sized,
    {
        many_m_n(
            0,
            6,
            alt((
                map(
                    preceded(
                        tuple((multispace0, tag("NamespaceDefaults"), multispace0)),
                        cut(NamespaceDefaults::from_sdl),
                    ),
                    |x| Namespace {
                        defaults: Some(x),
                        type_items: None,
                        enum_items: None,
                        cache_items: None,
                        pubsub_items: None,
                        task_items: None,
                    },
                ),
                map(
                    preceded(
                        tuple((multispace0, tag("Type"), multispace0)),
                        cut(Vec::<(String, TypeItem)>::from_sdl),
                    ),
                    |x| Namespace {
                        defaults: None,
                        type_items: Some(x),
                        enum_items: None,
                        cache_items: None,
                        pubsub_items: None,
                        task_items: None,
                    },
                ),
                map(
                    preceded(
                        tuple((multispace0, tag("Enum"), multispace0)),
                        cut(EnumItems::from_sdl),
                    ),
                    |x| Namespace {
                        defaults: None,
                        type_items: None,
                        enum_items: Some(x),
                        cache_items: None,
                        pubsub_items: None,
                        task_items: None,
                    },
                ),
                map(
                    preceded(
                        tuple((multispace0, tag("Cache"), multispace0)),
                        cut(Vec::<(String, CacheItem)>::from_sdl),
                    ),
                    |x| Namespace {
                        defaults: None,
                        type_items: None,
                        enum_items: None,
                        cache_items: Some(x),
                        pubsub_items: None,
                        task_items: None,
                    },
                ),
                map(
                    preceded(
                        tuple((multispace0, tag("PubSub"), multispace0)),
                        cut(Vec::<(String, PubSubItem)>::from_sdl),
                    ),
                    |x| Namespace {
                        defaults: None,
                        type_items: None,
                        enum_items: None,
                        cache_items: None,
                        pubsub_items: Some(x),
                        task_items: None,
                    },
                ),
                map(
                    preceded(
                        tuple((multispace0, tag("Task"), multispace0)),
                        cut(Vec::<(String, TaskItem)>::from_sdl),
                    ),
                    |x| Namespace {
                        defaults: None,
                        type_items: None,
                        enum_items: None,
                        cache_items: None,
                        pubsub_items: None,
                        task_items: Some(x),
                    },
                ),
            )),
        )(input)
        .map(|(remaining, namespaces)| {
            (
                remaining,
                namespaces.iter().fold(
                    Namespace {
                        defaults: None,
                        type_items: None,
                        enum_items: None,
                        cache_items: None,
                        pubsub_items: None,
                        task_items: None,
                    },
                    |mut acc, ns| {
                        if acc.defaults.is_none() {
                            acc.defaults = ns.defaults.clone();
                        }
                        if acc.type_items.is_none() {
                            acc.type_items = ns.type_items.clone();
                        }
                        if acc.enum_items.is_none() {
                            acc.enum_items = ns.enum_items.clone();
                        }
                        if acc.cache_items.is_none() {
                            acc.cache_items = ns.cache_items.clone();
                        }
                        if acc.pubsub_items.is_none() {
                            acc.pubsub_items = ns.pubsub_items.clone();
                        }
                        if acc.task_items.is_none() {
                            acc.task_items = ns.task_items.clone();
                        }
                        acc
                    },
                ),
            )
        })
    }
}

impl ToSdl for Namespace {
    fn to_sdl(&self, level: usize) -> String {
        let level_indent = indent(level);
        let mut result = String::from("");

        if let Some(x) = &self.defaults {
            result.push_str(&format!(
                "{}NamespaceDefaults {}\n",
                level_indent,
                x.to_sdl(level + 1)
            ));
        }
        if let Some(x) = &self.type_items {
            result.push_str(&format!("{}Type {}\n", level_indent, x.to_sdl(level)));
        }
        if let Some(x) = &self.enum_items {
            result.push_str(&format!("{}Enum {}\n", level_indent, x.to_sdl(level)));
        }
        if let Some(x) = &self.cache_items {
            result.push_str(&format!("{}Cache {}\n", level_indent, x.to_sdl(level)));
        }
        if let Some(x) = &self.pubsub_items {
            result.push_str(&format!("{}PubSub {}\n", level_indent, x.to_sdl(level)));
        }
        if let Some(x) = &self.task_items {
            result.push_str(&format!("{}Task {}\n", level_indent, x.to_sdl(level)));
        }

        result
    }
}

fn namespaces_from_sdl<'a, E: ParseError<&'a str> + nom::error::ContextError<&'a str>>(
    input: &'a str,
) -> IResult<&'a str, Vec<(String, Namespace)>, E> {
    many0(preceded(
        tuple((multispace0, tag("Namespace"), multispace1)),
        cut(terminated(
            pair(
                terminated(String::from_sdl, tuple((multispace0, char('{')))),
                Namespace::from_sdl,
            ),
            tuple((multispace0, char('}'))),
        )),
    ))(input)
}

fn namespaces_to_sdl(namespaces: &[(String, Namespace)], level: usize) -> String {
    let level_indent = indent(level);
    let mut result = String::from("");
    for (name, namespace) in namespaces {
        result.push_str(&format!(
            "{}Namespace {} {{\n{}{}}}\n\n",
            level_indent,
            name,
            namespace.to_sdl(level + 1),
            level_indent,
        ));
    }
    result
}

impl FromSdl for Schema {
    fn from_sdl<'a, E: ParseError<&'a str> + nom::error::ContextError<&'a str>>(
        input: &'a str,
    ) -> IResult<&'a str, Self, E>
    where
        Self: Sized,
    {
        map(
            tuple((
                opt(preceded(
                    tuple((multispace0, tag("Config"), multispace1)),
                    cut(Config::from_sdl),
                )),
                namespaces_from_sdl,
                opt(Namespace::from_sdl),
                namespaces_from_sdl,
            )),
            |(config, named_namespaces, global_namespace, more_named_namespaces)| Schema {
                config,
                global_namespace: global_namespace.unwrap_or(Namespace {
                    defaults: None,
                    type_items: None,
                    enum_items: None,
                    cache_items: None,
                    pubsub_items: None,
                    task_items: None,
                }),
                namespaces: named_namespaces
                    .into_iter()
                    .chain(more_named_namespaces.into_iter())
                    .collect(),
            },
        )(input)
    }
}

pub fn schema_to_sdl(schema: &Schema) -> String {
    let mut result = String::from("");
    let level = 0;

    if let Some(x) = &schema.config {
        result.push_str(&format!("Config {}\n\n", x.to_sdl(level)));
    }
    result.push_str(&format!("{}\n", schema.global_namespace.to_sdl(level)));
    result.push_str(&format!(
        "{}\n",
        namespaces_to_sdl(&schema.namespaces, level)
    ));

    result
}
