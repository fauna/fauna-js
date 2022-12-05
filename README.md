# Development

## Goals

1. Vend a Fauna client user's of Fauna can use on the server or the browser.
2. Vend Typescript for those who want it; plain javascript for those who don't.

## Setting up this Repo

1. Clone the repository; e.g. `gh repo clone fauna/fauna-js` if you use the GitHub CLI
2. Install dependencies via `yarn install`

## Running tests

1. Start a docker desktop or other docker platform.
2. Run `yarn test`. This will start local fauna containers, verify they're up and run all tests.

## Linting your code

Linting runs automatically on each commit.

If you wish to run on-demand run `yarn lint`.
