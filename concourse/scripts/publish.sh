#!/bin/sh

set -eou pipefail

cd ./fauna-js-repository

PACKAGE_VERSION=$(node -p -e "require('./package.json').version")
NPM_LATEST_VERSION=$(npm view fauna version)
echo "Current package version: $PACKAGE_VERSION"
echo "Latest version in npm: $NPM_LATEST_VERSION"
if [ "$PACKAGE_VERSION" \> "$NPM_LATEST_VERSION" ]
then
  npm install
  npm run build

  echo "Publishing a new version..."
  echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > .npmrc
  npm publish
  rm .npmrc

  echo "fauna-js@$PACKAGE_VERSION published to npm <!subteam^S0562QFL21M>" > ../slack-message/publish
else
  echo "fauna-js@${NPM_LATEST_VERSION} package has been already published" > ../slack-message/publish
  echo "fauna-js@${NPM_LATEST_VERSION} package has been already published" 1>&2
  exit 1
fi
