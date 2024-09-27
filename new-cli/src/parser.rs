use crate::{
    create_enum_with_const_slice, impl_from_and_to_sdl_for_enum, impl_from_and_to_sdl_for_struct,
    parser_tools::{indent, FromSdl, ToSdl},
};
use nom::{
    branch::{alt, permutation},
    bytes::complete::{is_not, tag},
    character::complete::{char, multispace0, multispace1},
    combinator::{cut, map, opt, value},
    error::{context, ParseError},
    multi::many0,
    sequence::{delimited, pair, preceded, terminated, tuple},
    IResult,
};
use serde::{Deserialize, Serialize};

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct Schema {
    pub config: Option<Config>,
    pub global_namespace: Namespace,
    pub namespaces: Vec<(String, Namespace)>,
}

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct Config {
    pub import: Vec<String>,
    pub export: Option<Export>,
}

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct Export {
    pub engine: Engine,
    pub files: Option<Vec<FileConfig>>,
}
impl FromSdl for Export {
    fn from_sdl<'a, E: ParseError<&'a str> + nom::error::ContextError<&'a str>>(
        input: &'a str,
    ) -> IResult<&'a str, Self, E>
    where
        Self: Sized,
    {
        preceded(char('{'),cut(terminated(permutation(({
            let parser = preceded(tuple((multispace0,tag(stringify!(engine)),multispace0,char(':'),multispace0)),cut(impl_from_and_to_sdl_for_struct!(@from_sdl Engine)));
            impl_from_and_to_sdl_for_struct!(@final_parser engine,Engine,parser)
        },{
            let parser = preceded(tuple((multispace0,tag(stringify!(files)),multispace0,char(':'),multispace0)),cut(impl_from_and_to_sdl_for_struct!(@from_sdl Option<Vec<FileConfig>>)));
            impl_from_and_to_sdl_for_struct!(@final_parser files,Option<Vec<FileConfig>>,parser)
        },)),preceded(multispace0,char('}')))))(input).map(|(remaining,fields)|{
            let(engine,files) = fields;
            (remaining,Export {
                engine,files
            })
        })
    }
}
impl ToSdl for Export {
    fn to_sdl(&self, level: usize) -> String {
        let level_indent = indent(level + 1);
        let mut result = String::from("{\n");
        impl_from_and_to_sdl_for_struct!(@to_sdl_field self.engine,stringify!(engine),Engine,level_indent,result,level);
        impl_from_and_to_sdl_for_struct!(@to_sdl_field self.files,stringify!(files),Option<Vec<FileConfig>>,level_indent,result,level);
        result.push_str(&format!("{}}}", indent(level)));
        result
    }
}

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]

pub enum Engine {
    Redis(Value),
}

impl_from_and_to_sdl_for_struct! {
#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct FileConfig {
    pub language: Language,
    pub path: String,
}
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
    pub type_items: Option<Vec<(String, TypeItem)>>,
    pub cache_items: Option<Vec<(String, CacheItem)>>,
    pub pubsub_items: Option<Vec<(String, PubSubItem)>>,
    pub task_items: Option<Vec<(String, TaskItem)>>,
}

#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct ItemWithPublic<O> {
    pub public: Vec<O>,
}

impl_from_and_to_sdl_for_struct! {
#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct NamespaceDefaults {
    pub cache_ttl: Option<Value>,
    pub task_queue_type: Option<Value>,
}
}

impl_from_and_to_sdl_for_struct! {
#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct CacheItem {
    pub key: Option<TypeItem>,
    pub payload: TypeItem,
    pub ttl: Option<Value>,
    pub public: Option<Vec<CacheOperation>>,
}
}

impl_from_and_to_sdl_for_struct! {
#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct PubSubItem {
    pub key: Option<TypeItem>,
    pub payload: TypeItem,
    pub public: Option<Vec<PubSubOperation>>,
}
}

impl_from_and_to_sdl_for_struct! {
#[derive(Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct TaskItem {
    pub key: Option<TypeItem>,
    pub payload: TypeItem,
    pub queue_type: Option<Value>,
    pub public: Option<Vec<TaskOperation>>,
}
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
    GetLen => "getLen"
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

impl FromSdl for Config {
    fn from_sdl<'a, E: ParseError<&'a str> + nom::error::ContextError<&'a str>>(
        input: &'a str,
    ) -> IResult<&'a str, Self, E>
    where
        Self: Sized,
    {
        map(
            preceded(
                char('{'),
                cut(terminated(
                    permutation((
                        opt(preceded(
                            tuple((
                                multispace0,
                                tag("import"),
                                multispace0,
                                char(':'),
                                multispace0,
                            )),
                            cut(map(Vec::<String>::from_sdl, |v| {
                                v.into_iter()
                                    .map(|x| format!("\"{}\"", x).to_string())
                                    .collect::<Vec<_>>()
                            })),
                        )),
                        opt(preceded(
                            tuple((
                                multispace0,
                                tag("export"),
                                multispace0,
                                char(':'),
                                multispace0,
                            )),
                            cut(Export::from_sdl),
                        )),
                    )),
                    preceded(multispace0, char('}')),
                )),
            ),
            |(import, export)| Config {
                import: import.unwrap_or(vec![]),
                export,
            },
        )(input)
    }
}

fn rem_first_and_last(value: &str) -> String {
    let first_last_off = &value[1..value.len() - 1];
    first_last_off.to_string()
}

impl ToSdl for Config {
    fn to_sdl(&self, level: usize) -> String {
        let level_indent = indent(level + 1);
        let mut result = String::from("{\n");

        if self.import.len() != 0 {
            result.push_str(&format!(
                "{}import: {}\n",
                level_indent,
                self.import
                    .iter()
                    .map(|x| rem_first_and_last(x))
                    .collect::<Vec<_>>()
                    .to_sdl(level)
            ));
        }
        if let Some(export) = &self.export {
            result.push_str(&format!(
                "{}export: {}\n",
                level_indent,
                export.to_sdl(level + 1)
            ));
        }
        result.push_str(&format!("{}}}", indent(level)));

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
        map(
            permutation((
                opt(preceded(
                    tuple((multispace0, tag("NamespaceDefaults"), multispace0)),
                    cut(NamespaceDefaults::from_sdl),
                )),
                opt(preceded(
                    tuple((multispace0, tag("Type"), multispace0)),
                    cut(Vec::<(String, TypeItem)>::from_sdl),
                )),
                opt(preceded(
                    tuple((multispace0, tag("Cache"), multispace0)),
                    cut(Vec::<(String, CacheItem)>::from_sdl),
                )),
                opt(preceded(
                    tuple((multispace0, tag("PubSub"), multispace0)),
                    cut(Vec::<(String, PubSubItem)>::from_sdl),
                )),
                opt(preceded(
                    tuple((multispace0, tag("Task"), multispace0)),
                    cut(Vec::<(String, TaskItem)>::from_sdl),
                )),
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
        if let Some(x) = &self.task_items {
            result.push_str(&format!("{}Type {}\n", level_indent, x.to_sdl(level + 1)));
        }
        if let Some(x) = &self.cache_items {
            result.push_str(&format!("{}Cache {}\n", level_indent, x.to_sdl(level + 1)));
        }
        if let Some(x) = &self.pubsub_items {
            result.push_str(&format!("{}PubSub {}\n", level_indent, x.to_sdl(level + 1)));
        }
        if let Some(x) = &self.task_items {
            result.push_str(&format!("{}Task {}\n", level_indent, x.to_sdl(level + 1)));
        }

        result
    }
}

fn namespaces_from_sdl<'a, E: ParseError<&'a str> + nom::error::ContextError<&'a str>>(
    input: &'a str,
) -> IResult<&'a str, Vec<(String, Namespace)>, E> {
    many0(preceded(
        tuple((tag("Namespace"), multispace1)),
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
    let level_indent = indent(level + 1);
    let mut result = String::from("{\n");
    for (name, namespace) in namespaces {
        result.push_str(&format!(
            "{}Namespace {}{}",
            level_indent,
            name,
            namespace.to_sdl(level + 1)
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
                opt(Config::from_sdl),
                namespaces_from_sdl,
                opt(Namespace::from_sdl),
                namespaces_from_sdl,
            )),
            |(config, named_namespaces, global_namespace, more_named_namespaces)| Schema {
                config,
                global_namespace: global_namespace.unwrap_or(Namespace {
                    defaults: None,
                    type_items: None,
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
        result.push_str(&format!("{}\n", x.to_sdl(level)));
    }
    result.push_str(&format!("{}\n", schema.global_namespace.to_sdl(level)));
    result.push_str(&format!(
        "{}\n",
        namespaces_to_sdl(&schema.namespaces, level)
    ));

    result
}
