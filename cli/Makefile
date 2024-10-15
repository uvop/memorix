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

FORCE: ;
