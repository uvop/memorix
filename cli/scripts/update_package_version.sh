#!/bin/bash
echo "$(cat package.json | sed -e """s|\"version\": \".*\"|\"version\": \"$VERSION\"|1""")" > package.json