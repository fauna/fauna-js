#!/bin/sh

set -eou

cd ./fauna-js-repository

npm install -g -s --no-progress yarn

yarn test:integration
