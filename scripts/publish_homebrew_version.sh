#!/bin/bash

set -e

if [[ -z "$VERSION" ]]; then
  echo "Missing target VERSION environment variable, please specify it"
  exit 1
fi

# Removing the v suffix, if present
VERSION=${VERSION#"v"}


echo "Targeting version $VERSION"

echo "Reading artifacts hashes"
LINUX_INTEL_SHA=$(shasum -a 256 ./cli/lib/release/memorix-linux-x64.tar.gz | awk '{print $1}')
MAC_INTEL_SHA=$(shasum -a 256 ./cli/lib/release/memorix-macos-x64.tar.gz | awk '{print $1}')
MAC_M1_SHA=$(shasum -a 256 ./cli/lib/release/memorix-macos-arm64.tar.gz | awk '{print $1}')

echo "Cloning tap repository"

git clone git@github.com:uvop/homebrew-memorix.git
cd ./homebrew-memorix
echo "Rendering formula template"

cat ../scripts/formula_template.rb | sed "s/{{{VERSION}}}/$VERSION/g" | \
  sed "s/{{{LINUX_INTEL_SHA}}}/$LINUX_INTEL_SHA/g" | \
  sed "s/{{{MAC_INTEL_SHA}}}/$MAC_INTEL_SHA/g" | \
  sed "s/{{{MAC_M1_SHA}}}/$MAC_M1_SHA/g" > ./Formula/memorix.rb

echo "Committing version update"
git add Formula/memorix.rb
git commit -m "Version bump: $VERSION"

echo "Pushing changes"
git push

echo "Done!"