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
macro_rules! permutation_many {
    () => {
        many_m_n(0, 0, nom::combinator::fail)
    };
    ( $total:tt, $( ($parser:expr, $index:tt, $required:tt) ),+ $(,)? ) => {
        map(
            context(
                "Missing some required parsers here",
                verify(
                    map(
                        many_m_n(0, $total,
                            alt((
                                $( map($parser, move |x| {
                                    let mut tuple = permutation_many!(@create_none_tuple $total);
                                    tuple.$index = Some(x);
                                    tuple
                                }), )+
                            ))
                        ),
                        |vec| {
                            let tuple = vec.into_iter().fold(
                                permutation_many!(@create_none_tuple $total),
                                |mut acc, item| {
                                    $( permutation_many!(@collect $index, acc, item); )+
                                    acc
                                }
                            );
                            (
                                $( tuple.$index ),+
                            )
                        }
                    ),
                    #[allow(unused_variables)]
                    |tuple| {
                        $( permutation_many!(@verify_field tuple.$index, $required) && )+ true
                    }
                ),
            ),
            |tuple| {
                (
                    $( permutation_many!(@handle_required tuple.$index, $required), )+
                )
            }
        )
    };
    (@create_none_tuple 1) => { (None,) };
    (@create_none_tuple 2) => { (None, None) };
    (@create_none_tuple 3) => { (None, None, None) };
    (@create_none_tuple 4) => { (None, None, None, None) };
    (@create_none_tuple 5) => { (None, None, None, None, None) };
    (@create_none_tuple 6) => { (None, None, None, None, None, None) };
    (@collect $index:tt, $acc:expr, $item:expr) => {
        if $acc.$index.is_none() { $acc.$index = $item.$index; }
    };
    (@verify_field $field:expr, true) => {
        $field.is_some()
    };
    (@verify_field $field:expr, false) => {
        true
    };
    (@handle_required $field:expr, true) => {
        $field.expect("Shouldn't get here")
    };
    (@handle_required $field:expr, false) => {
        $field
    };
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
    (($struct_name:ident, $total: tt), $(($field:ident: $field_type:ty, $index:tt, $required:tt)),+ $(,)?) => {
        impl FromSdl for $struct_name {
            fn from_sdl<'a, E: ParseError<&'a str> + nom::error::ContextError<&'a str>>(input: &'a str) -> IResult<&'a str, Self, E>
            where
                Self: Sized,
            {
                preceded(
                    char('{'),
                    cut(terminated(
                        permutation_many!(
                            $total,

                            $(
                                (
                                    preceded(
                                        tuple((multispace0, tag(stringify!($field)), multispace0, char(':'), multispace0)),
                                        cut(<$field_type>::from_sdl)
                                    ),
                                    $index,
                                    $required
                                ),
                            )+
                        ),
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
                    impl_from_and_to_sdl_for_struct!(@to_sdl_field self.$field, $field, $required, level_indent, result, level);
                )+

                result.push_str(&format!("{}}}", indent(level)));
                result
            }
        }
    };

    (@from_sdl_field $field:ident, $parser:expr, false) => {
        opt($parser)
    };

    (@from_sdl_field $field:ident, $parser:expr, true) => {
        context(concat!("Missing required key \"", stringify!($field), "\""), $parser)
    };

    (@to_sdl_field $field:expr, $field_name:ident, false, $indent:expr, $result:expr, $level:expr) => {
        if let Some(value) = &$field {
            $result.push_str(&format!(
                concat!("{}", stringify!($field_name),": {}\n"),
                $indent,
                value.to_sdl($level + 1)
            ));
        }
    };

    (@to_sdl_field $field:expr, $field_name:ident, true, $indent:expr, $result:expr, $level:expr) => {
        $result.push_str(&format!(
            concat!("{}", stringify!($field_name),": {}\n"),
            $indent,
            $field.to_sdl($level + 1)
        ));
    };
}
