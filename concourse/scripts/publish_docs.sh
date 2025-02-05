#!/bin/sh

set -eou

# Setup
echo 'Set up git'
apk add --no-progress --no-cache git

cd ./fauna-js-repository

PACKAGE_VERSION=$(node -p -e "require('./package.json').version")

# Generate docs
npm install
npm run doc

echo "Current docs version: $PACKAGE_VERSION"

cd ../
git clone fauna-js-repository-docs fauna-js-repository-updated-docs
cd fauna-js-repository-updated-docs

if [ -d "$PACKAGE_VERSION" ]; then
    rm -rf "$PACKAGE_VERSION"
    echo "Existing $PACKAGE_VERSION directory removed."
fi

cp -R "../fauna-js-repository/docs" "$PACKAGE_VERSION"

HEAD_GTM=$(cat ../fauna-js-repository/concourse/scripts/head_gtm.dat)
sed -i.bak "0,/<\/title>/{s/<\/title>/<\/title>${HEAD_GTM}/}" ./$PACKAGE_VERSION/index.html

BODY_GTM=$(cat ../fauna-js-repository/concourse/scripts/body_gtm.dat)
sed -i.bak "0,/<body>/{s/<body>/<body>${BODY_GTM}/}" ./$PACKAGE_VERSION/index.html

rm ./$PACKAGE_VERSION/index.html.bak

echo "Updating 'latest' symlink to point to $PACKAGE_VERSION"
ln -sfn "$PACKAGE_VERSION" latest

git config --global user.email "nobody@fauna.com"
git config --global user.name "Fauna, Inc"

git add -A
git commit -m "Update docs to version: $PACKAGE_VERSION"

echo "Updated docs to version: $PACKAGE_VERSION"
