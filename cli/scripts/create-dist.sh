#!/bin/bash

mv ./target/x86_64-unknown-linux-gnu/release/memorix-cli memorix
tar -czf ./target/memorix-linux-x64.tar.gz memorix
rm memorix

mv ./target/x86_64-pc-windows-gnu/release/memorix-cli.exe memorix.exe
zip ./target/memorix-win-x64.zip memorix.exe
rm memorix.exe

mv ./target/x86_64-apple-darwin/release/memorix-cli memorix
tar -czf ./target/memorix-macos-arm64.tar.gz memorix
tar -czf ./target/memorix-macos-x64.tar.gz memorix
rm memorix