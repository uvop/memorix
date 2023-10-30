install:
	cargo build
codegen:
	(cd ../../../cli && yarn cli codegen ../clients/redis/rust/src/example-schema.memorix) &&\
	 \
	make format
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
	cargo run

FORCE: ;
