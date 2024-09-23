mod parser;

use std::fmt;
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

    let fs = parser::RealFileSystem {};

    let schema = parser::parse_schema(&fs, abs_file_path)?;

    println!("{:#?}", schema);

    Ok(())
}
