#!/bin/sh
set -eou

npm install -g -s --no-progress yarn

yarn test:integration
