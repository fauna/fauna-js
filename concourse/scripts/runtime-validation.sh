#!/bin/sh
set -eou pipefail

cd testtools/fauna-driver-platform-tests

yarn js:aws-lambda:deploy && yarn js:aws-lambda:deploy 
yarn js:cloudflare:deploy && yarn js:cloudflare:deploy 
yarn js:netlify:deploy && yarn js:netlify:deploy 
yarn js:vercel:deploy && yarn js:vercel:deploy 

