#!/bin/bash
echo "$(cat cargo.toml | sed "1,/version = \".*\"/s/version = \".*\"/version = \"$VERSION\"/")" > cargo.toml