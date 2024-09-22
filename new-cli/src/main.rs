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

    let fs = parser::RealFileSystem {};

    let schema = parser::parse_schema(&fs, &PathBuf::from(file_path))?;

    println!("{:#?}", schema);

    Ok(())
}
