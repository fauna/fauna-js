#!/bin/sh

set -eou

# Setup
echo 'Set up git'
apk add --no-progress --no-cache git

cd ./fauna-js-repository

PACKAGE_VERSION=$(node -p -e "require('./package.json').version")

# Generate docs
npm install
npm run docs

echo "Current docs version: $PACKAGE_VERSION"

cd ../
git clone fauna-js-repository-docs fauna-js-repository-updated-docs
cd fauna-js-repository-updated-docs

if [ -d "$PACKAGE_VERSION" ]; then
    rm -rf "$PACKAGE_VERSION"
    echo "Existing $PACKAGE_VERSION directory removed."
fi

cp -R "../fauna-js-repository/build/docs" "$PACKAGE_VERSION"

echo "Updating 'latest' symlink to point to $PACKAGE_VERSION"
ln -sfn "$PACKAGE_VERSION" latest

git config --global user.email "nobody@fauna.com"
git config --global user.name "Fauna, Inc"

git add -A
git commit -m "Update docs to version: $PACKAGE_VERSION"

echo "Updated docs to version: $PACKAGE_VERSION"
