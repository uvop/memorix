install:
	cargo build
codegen:
	(cd ../../../cli && yarn cli codegen ../clients/redis/rust/examples/example-schema.memorix) &&\
	 \
	make format && \
	echo "\nfn main() {}" >> ./examples/example_schema_generated.rs
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
	cargo test
start: FORCE
	cargo run --example example

FORCE: ;
