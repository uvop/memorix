install:
	cargo build
format:
	cargo fmt
format-check:
	cargo fmt --check
lint:
	cargo clippy -- -D warnings
lint-fix:
	cargo clippy --fix
typecheck:
	cargo check
test: FORCE
	cargo test -- --nocapture
build:
	cargo build --release --target x86_64-unknown-linux-gnu && \
	cargo build --release --target x86_64-pc-windows-gnu && \
	export CC=o64-clang && \
	export CXX=o64-clang++ && \
	cargo build --release --target x86_64-apple-darwin
FORCE: ;
