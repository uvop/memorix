codegen:
	(cd ../../../cli && cargo run -- format ../clients/redis/js/src/example-schema.memorix && cargo run -- codegen ../clients/redis/js/src/example-schema.memorix) && \
	sed -i '' 's|@memorix/client-redis|./index.ts|g' ./src/example-schema.generated.ts
format:
	deno fmt
format-check:
	deno fmt --check
lint:
	deno lint
typecheck:
	deno check src/**/*
test:
	deno test --allow-env --allow-net