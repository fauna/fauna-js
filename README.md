# Setting up this Repo

1. Clone the repository; e.g. `gh repo clone fauna/fauna-js` if you use the GitHub CLI
2. Install dependencies via `yarn install`

# Running tests

1. Start local Fauna containers using `yarn fauna-local; yarn fauna-local-alt-port`
2. Wait a bit for for those containers to start (TODO automate this wait).
3. Run the tests: `yarn test`

# Linting your code

Run `yarn lint`. Linting will auslo run automatically on each commit.
