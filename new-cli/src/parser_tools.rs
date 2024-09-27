use nom::combinator::cut;
use nom::error::context;
use nom::{
    branch::alt,
    bytes::complete::tag,
    character::complete::{alpha1, alphanumeric1, char, multispace0, multispace1},
    combinator::{map, recognize},
    error::ParseError,
    multi::{many0, separated_list0},
    sequence::{pair, preceded, separated_pair, terminated, tuple},
    IResult,
};

pub fn indent(level: usize) -> String {
    "  ".repeat(level)
}

#[macro_export]
macro_rules! create_enum_with_const_slice {
    (
        $(#[$meta:meta])*
        $vis:vis enum $name:ident {
            $($(#[$variant_meta:meta])* $variant:ident),+ $(,)?
        }
        $const_vis:ident $const_name:ident
    ) => {
        $(#[$meta])*
        $vis enum $name {
            $($(#[$variant_meta])* $variant),+
        }

        $const_vis const $const_name: &'static [$name] = &[
            $($name::$variant),+
        ];
    }
}

pub trait FromSdl {
    fn from_sdl<'a, E: ParseError<&'a str> + nom::error::ContextError<&'a str>>(
        input: &'a str,
    ) -> IResult<&'a str, Self, E>
    where
        Self: Sized;
}
pub trait ToSdl {
    fn to_sdl(&self, level: usize) -> String;
}

impl FromSdl for String {
    fn from_sdl<'a, E: ParseError<&'a str> + nom::error::ContextError<&'a str>>(
        input: &'a str,
    ) -> IResult<&'a str, Self, E>
    where
        Self: Sized,
    {
        map(
            recognize(pair(
                alt((alpha1, tag("_"))),
                many0(alt((alphanumeric1, tag("_")))),
            )),
            |x: &str| x.to_string(),
        )(input)
    }
}

impl ToSdl for String {
    fn to_sdl(&self, _: usize) -> String {
        self.to_string()
    }
}

impl<T: FromSdl> FromSdl for Vec<T> {
    fn from_sdl<'a, E: ParseError<&'a str> + nom::error::ContextError<&'a str>>(
        input: &'a str,
    ) -> IResult<&'a str, Self, E>
    where
        Self: Sized,
    {
        context(
            "array",
            preceded(
                tuple((char('['), multispace0)),
                cut(terminated(
                    separated_list0(multispace1, T::from_sdl),
                    preceded(multispace0, char(']')),
                )),
            ),
        )(input)
    }
}

impl<T: ToSdl> ToSdl for Vec<T> {
    fn to_sdl(&self, level: usize) -> String {
        let level_indent = indent(level + 1);
        let mut result = String::from("[\n");

        for item in self {
            result.push_str(&format!("{}{}\n", level_indent, item.to_sdl(level + 1)));
        }
        result.push_str(&format!("{}]", indent(level)));

        result
    }
}

impl<T: FromSdl> FromSdl for Vec<(String, T)> {
    fn from_sdl<'a, E: ParseError<&'a str> + nom::error::ContextError<&'a str>>(
        input: &'a str,
    ) -> IResult<&'a str, Self, E>
    where
        Self: Sized,
    {
        context(
            "hash",
            preceded(
                char('{'),
                cut(terminated(
                    map(
                        separated_list0(
                            multispace1,
                            separated_pair(
                                preceded(multispace0, String::from_sdl),
                                cut(tuple((multispace0, char(':')))),
                                preceded(multispace0, T::from_sdl),
                            ),
                        ),
                        |tuple_vec| tuple_vec.into_iter().map(|(k, v)| (k, v)).collect(),
                    ),
                    preceded(multispace0, char('}')),
                )),
            ),
        )(input)
    }
}

impl<T: ToSdl> ToSdl for Vec<(String, T)> {
    fn to_sdl(&self, level: usize) -> String {
        let level_indent = indent(level + 1);
        let mut result = String::from("{\n");

        for (key, value) in self {
            result.push_str(&format!(
                "{}{}: {}\n",
                level_indent,
                key,
                value.to_sdl(level + 1)
            ));
        }
        result.push_str(&format!("{}}}", indent(level)));

        result
    }
}

#[macro_export]
macro_rules! impl_from_and_to_sdl_for_enum {
    ($enum_name:ident, $($variant:ident => $str_val:expr),+ $(,)?) => {
        impl FromSdl for $enum_name {
            fn from_sdl<'a, E: ParseError<&'a str> + nom::error::ContextError<&'a str>>(input: &'a str) -> IResult<&'a str, Self, E>
            where
                Self: Sized,
            {
                alt((
                    $(value($enum_name::$variant, tag($str_val))),+
                ))(input)
            }
        }
        impl ToSdl for $enum_name {
            fn to_sdl(&self, _: usize) -> String {
                match self {
                    $($enum_name::$variant => $str_val.to_string()),+
                }
            }
        }
    };
}

#[macro_export]
macro_rules! impl_from_and_to_sdl_for_struct {
    (
        $(#[$attr:meta])*
        $vis:vis struct $struct_name:ident {
            $(
                $vis_field:vis $field:ident: $field_type:ty
            ),+ $(,)?
        }
    ) => {
        $(#[$attr])*
        $vis struct $struct_name {
            $(
                $vis_field $field: $field_type
            ),+
        }

        impl FromSdl for $struct_name {
            fn from_sdl<'a, E: ParseError<&'a str> + nom::error::ContextError<&'a str>>(input: &'a str) -> IResult<&'a str, Self, E>
            where
                Self: Sized,
            {
                preceded(
                    char('{'),
                    cut(terminated(
                        permutation((
                            $(
                                {
                                    let parser = preceded(
                                        tuple((multispace0, tag(stringify!($field)), multispace0, char(':'), multispace0)),
                                        cut(impl_from_and_to_sdl_for_struct!(@from_sdl $field_type))
                                    );
                                    impl_from_and_to_sdl_for_struct!(@final_parser $field, $field_type, parser)
                                },
                            )+
                        )),
                        preceded(multispace0, char('}'))
                    ))
                )(input)
                .map(|(remaining, fields)| {
                    let ($($field),+) = fields;
                    (remaining, $struct_name { $($field),+ })
                })
            }
        }

        impl ToSdl for $struct_name {
            fn to_sdl(&self, level: usize) -> String {
                let level_indent = indent(level + 1);
                let mut result = String::from("{\n");

                $(
                    impl_from_and_to_sdl_for_struct!(@to_sdl_field self.$field, stringify!($field), $field_type, level_indent, result, level);
                )+

                result.push_str(&format!("{}}}", indent(level)));
                result
            }
        }
    };

    (@from_sdl Option<$inner:ty>) => {
        $inner::from_sdl
    };

    (@from_sdl $other:ty) => {
        <$other>::from_sdl
    };


    (@final_parser $field:ident, Option<$inner:ty>, $parser:expr) => {
        opt($parser)
    };

    (@final_parser $field:ident, $other:ty, $parser:expr) => {
        context(concat!("Missing required key \"", stringify!($field), "\""), $parser)
    };

    (@to_sdl_field $field:expr, $field_name:expr, Option<$inner:ty>, $indent:expr, $result:expr, $level:expr) => {
        if let Some(value) = &$field {
            $result.push_str(&format!(
                concat!("{}", stringify!($field_name),": {}\n"),
                $indent,
                value.to_sdl($level + 1)
            ));
        }
    };

    (@to_sdl_field $field:expr, $field_name:expr, $field_type:ty, $indent:expr, $result:expr, $level:expr) => {
        $result.push_str(&format!(
            concat!("{}", stringify!($field_name),": {}\n"),
            $indent,
            $field.to_sdl($level + 1)
        ));
    };
}
