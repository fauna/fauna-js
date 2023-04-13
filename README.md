> **WARNING**
> This driver is in beta release and not recommended for production use. It operates with the Fauna database service via an API which is also in beta release, and is not recommended for production use. This driver is not compatible with v4 or earlier versions of Fauna. Please feel free to contact product@fauna.com to learn about our special Early Access program for FQL X.

# A JavaScript driver for [Fauna](https://fauna.com).

[![Npm Version](https://img.shields.io/npm/v/fauna.svg?maxAge=21600)](https://www.npmjs.com/package/fauna)
[![License](https://img.shields.io/badge/license-MPL_2.0-blue.svg?maxAge=2592000)](https://raw.githubusercontent.com/fauna/fauna-js/main/LICENSE)

See the [Fauna Documentation](https://fqlx-beta--fauna-docs.netlify.app/fqlx/beta/) for additional information how to configure and query your databases.

This driver can only be used with FQL X, and is not compatible with earlier versions of FQL. To query your databases with earlier API versions, see the [faunadb](https://www.npmjs.com/package/faunadb) package.

<details>
<summary>Table of Contents</summary>

- [A JavaScript driver for Fauna.](#a-javascript-driver-for-fauna)
- [Quick-Start](#quick-start)
- [Supported Runtimes](#supported-runtimes)
- [Installing](#installing)
  - [Package Manager](#package-manager)
  - [Via CDN](#via-cdn)
- [Usage](#usage)
  - [Connecting from the browser](#connecting-from-the-browser)
  - [Importing into a bundled project](#importing-into-a-bundled-project)
  - [Typescript Support](#typescript-support)
  - [Query Options](#query-options)
  - [Client Configuration](#client-configuration)
    - [Using environment variables](#using-environment-variables)
  - [Query Statistics](#query-statistics)
  - [Advanced example](#advanced-example)
    - [Querying with FQL X](#querying-with-fql-x)
    - [Composition Using the Driver](#composition-using-the-driver)
- [Contributing](#contributing)
  - [Setting up this Repo](#setting-up-this-repo)
  - [Running tests](#running-tests)
  - [Linting your code](#linting-your-code)
- [License](#license)

</details>

# Quick-Start

```javascript
import { Client, fql } from "fauna";

// configure your client
const client = new Client({
  secret: YOUR_FAUNA_SECRET,
});

try {
  // build queries using the fql function
  const collection_query = fql`Collection.create({ name: "Dogs" })`;
  // execute the query
  const collection_result = await client.query(collection_query);

  // define some data in your app
  const dog = { name: "Scout" };

  // query using your app's local variables
  const document_query = fql`
    Dogs.create(${dog}) {
      id,
      ts,
      name
    }
  `;
  const document_result = await client.query(document_query);
} catch (error) {
  if (error instanceof fauna.FaunaError) {
    // handle errors
  }
}
```

# Supported Runtimes

This Driver supports and is tested on:

- Browsers - Stable versions of
  - Chrome
  - Firefox
  - Safari
  - Edge
- Node.js - [Current and Active LTS](https://nodejs.org/en/about/releases/)
  - Current - v19
  - Active LTS - v18
- Cloudflare Workers
- AWS Lambda
- Netlify
- Vercel

# Installing

## Package Manager

The fauna-js driver is available on npm. You can install with your package manager of choice:

```shell
npm install fauna
```

or

```shell
yarn add fauna
```

## Via CDN

The driver is additionally made available to browsers via CDN:

```html
<script type="module">
  import * as fauna from "https://cdn.jsdelivr.net/npm/fauna@latest/dist/browser/index.js";
</script>
```

# Usage

## Creating queries with the `fql` function

The `fql` function is your gateway to building safe, reuseable Fauna queries.

It allows you compose queries from sub-queries and variables native to your program. Variables passed in are treated as unexecutable values in Fauna's API - preventing security issues like injection attacks.

for example:

```typescript
let collectionName = "Pets";

// a reusable sub query to determine a collections existence
let collectionExists = fql`Collection.byName(${collectionName}) != null`;

client.query(fql`
  if (${collectionExists}) {
    "Collection exists!"
  } else {
    Collection.create({ name: ${collectionName} })
    "Collection exists now!"
  }
```

This has several advantages:

- You can use `fql` to build a library of subqueries applicable to your domain - and combinable in whatever way you need
- injection attacks are not possible if you pass input variables into the interpolated (`${i'm interpoloated}`) parts of the query.
- the driver speaks "pure FQL X" - you can try out some FQL X on the dashboard's terminal and paste it directly into your app like fql\`copied from terminal...\` and the query will work as is.

The following subsections show some further examples.

### Pure FQL X via the `fql` function

The `fql` function can also create pure FQL X queries, for example:

```javascript
const result = await client.query(fql`
  let create_user = (params) => if (params.email != null) {
    User.create(params)
  } else {
    null
  }

  let u = create_user({
    name: "Alice",
    email: "alice@site.example",
  })

  u {
    id,
    ts,
    name,
    email
  }
`);
```

### Advanced Composition example using `fql` function

```javascript
// a reusable FQL X lambda to create Users with validated parameters
const create_user = fql`
  (params) => if (params.email != null) {
    User.create(params)
  } else {
    null
  }
`;

// a reusable projection to format User documents
const user_projection = fql`{ id, ts, name, email }`;

// an object to pass to the query
const user_params = {
  name: "Alice",
  email: "alice@site.example",
};

// put everything together
const composed_query = fql`
  let create_user = ${create_user}
  
  let u = create_user(${user_params})

  u ${user_projection}
`;
const result2 = await client.query(composed_query);
```

## Connecting from the browser

```html
<html>
  <head></head>
  <body>
    <h1>Test</h1>
  </body>
  <script type="module">
    import * as fauna from "https://cdn.jsdelivr.net/npm/fauna@latest/dist/browser/index.js";

    /* ... */
  </script>
</html>
```

## Importing into a bundled project

```javascript
import * as fauna from "fauna";
```

or using `require` for CommonJS files

```javascript
const fauna = require("fauna");
```

## Typescript Support

With TypeScript, you can apply a type parameter to your result.

```typescript
import { Document, type DocumentT } from "fauna";

type User = {
  name: string;
  email: string;
};

const query = fql`User.create({
  name: "Alice",
  email: "alice@site.example",
})`;

const result = await client.query<DocumentT<User>>(query);
const user_doc = result.data;

// you have typesafe access to `Document` and `User` fields
console.assert(user_doc instanceof Document);
console.assert(user_doc.id);
console.assert(user_doc.ts);
console.assert(user_doc.name === "Alice");
console.assert(user_doc.email === "alice@site.example");
```

## Query Options

Options are available to configure queries on each request.

```typescript
import { Client, type QueryRequestHeaders } from "fauna";

const client = new Client();

const options: QueryRequestHeaders = {
  format: "tagged",
  linearized: false,
  query_timeout_ms: 60_000,
  max_contention_retries: 5,
  query_tags: { name: "readme query" },
  traceparent: "00-750efa5fb6a131eb2cf4db39f28366cb-000000000000000b-00",
  typecheck: true,
};

const result = await client.query(SOME_QUERY, options);
```

## Client Configuration

The driver use's a default ClientConfiguration. We recommend most users stick with the defaults.

If your environment needs different configuration however, the default ClientConfiguration can be overriden.

Furthermore, on each request you can provide query specific configuration that will override the setting in your client for that request only.

```typescript
import { Client, endpoints, type ClientConfiguration } from "fauna";

const config: ClientConfiguration = {
  // configure client
  secret: YOUR_FAUNA_SECRET,
  endpoint: endpoints.default,
  // note this will change names during the early access beta
  // to reflect HTTP/2 semantics
  max_conns: 10,

  // set default query options
  format: "tagged",
  linearized: false,
  query_timeout_ms: 60_000,
  max_contention_retries: 5,
  query_tags: { name: "readme query" },
  traceparent: "00-750efa5fb6a131eb2cf4db39f28366cb-000000000000000b-00",
  typecheck: true,
};

const client = new Client(config);
```

### Using environment variables

The driver will default to configuring your client with the values of the `FAUNA_SECRET` and `FAUNA_ENDPOINT` environment variable.

For example, if you set the following environment variables:

```shell
export FAUNA_SECRET=YOUR_FAUNA_SECRET
export FAUNA_ENDPOINT=https://db.fauna.com/
```

you can create a client without additional options

```
const client = new Client()
```

## Query Statistics

Query statistics are returned with successful query responses and `ServiceError`s.

````typescript
import {
  ServiceError,
  type QueryInfo,
  type QueryStats,
  type QuerySuccess,
} from "fauna";

try {
  const result: QuerySuccess<string> = await client.query(fql`"Hello world"`);
  const stats: QueryStats | undefined = result.stats;
} catch (error: any) {
  if (error instanceof ServiceError) {
    const info: QueryInfo = error.queryInfo;
    const stats: QueryStats | undefined = info.stats;
  }
}

console.log(stats);
/* example output
 * ```
 *  {
 *    compute_ops: 1,
 *    read_ops: 0,
 *    write_ops: 0,
 *    query_time_ms: 15,
 *    storage_bytes_read: 0,
 *    storage_bytes_write: 0,
 *    contention_retries: 0
 *  }
 * ```
 */
````

# Contributing

Any contributions are from the community are greatly appreciated!

If you have a suggestion that would make this better, please fork the repo and create a pull request. You may also simply open an issue. We provide templates, so please complete those to the best of your ability.

Don't forget to give the project a star! Thanks again!

## Setting up this Repo

1. Clone the repository; e.g. `gh repo clone fauna/fauna-js` if you use the GitHub CLI
2. Install dependencies via `yarn install`

## Running tests

1. Start a docker desktop or other docker platform.
2. Run `yarn test`. This will start local fauna containers, verify they're up and run all tests.

## Linting your code

Linting runs automatically on each commit.

If you wish to run on-demand run `yarn lint`.

# License

Distributed under the MPL 2.0 License. See [LICENSE](./LICENSE) for more information.
