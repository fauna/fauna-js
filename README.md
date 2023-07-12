> **WARNING**
> This driver is in beta release and not recommended for production use. It operates with the Fauna database service via an API which is also in beta release, and is not recommended for production use. This driver is not compatible with v4 or earlier versions of Fauna. Please feel free to contact product@fauna.com to learn about our special Early Access program for FQL v10.

# A JavaScript driver for [Fauna](https://fauna.com).

[![Npm Version](https://img.shields.io/npm/v/fauna.svg?maxAge=21600)](https://www.npmjs.com/package/fauna)
[![License](https://img.shields.io/badge/license-MPL_2.0-blue.svg?maxAge=2592000)](https://raw.githubusercontent.com/fauna/fauna-js/main/LICENSE)

See the [Fauna Documentation](https://fqlx-beta--fauna-docs.netlify.app/fqlx/beta/) for additional information how to configure and query your databases.

This driver can only be used with FQL v10, and is not compatible with earlier versions of FQL. To query your databases with earlier API versions, see the [faunadb](https://www.npmjs.com/package/faunadb) package.

<details>
<summary>Table of Contents</summary>

- [A JavaScript driver for Fauna.](#a-javascript-driver-for-fauna)
- [Quick-Start](#quick-start)
- [Supported Runtimes](#supported-runtimes)
- [Installing](#installing)
  - [Package Manager](#package-manager)
  - [Via CDN](#via-cdn)
- [Usage](#usage)
  - [Creating queries with the `fql` function](#creating-queries-with-the-fql-function)
  - [Connecting from the browser](#connecting-from-the-browser)
  - [Importing into a bundled project](#importing-into-a-bundled-project)
  - [Typescript Support](#typescript-support)
  - [Query Options](#query-options)
  - [Client Configuration](#client-configuration)
    - [Timeouts](#timeouts)
      - [Query Timeout](#query-timeout)
      - [Client Timeout](#client-timeout)
      - [HTTP/2 Session Idle Timeout](#http2-session-idle-timeout)
    - [Using environment variables](#using-environment-variables)
  - [Query Statistics](#query-statistics)
- [Contributing](#contributing)
  - [Setting up this Repo](#setting-up-this-repo)
  - [Running tests](#running-tests)
  - [Linting your code](#linting-your-code)
- [License](#license)

</details>

# Quick-Start

```javascript
import { Client, fql, FaunaError } from "fauna";

// configure your client
const client = new Client({
  secret: YOUR_FAUNA_SECRET,
});

try {
  // build queries using the `fql` function
  const collectionQuery = fql`Collection.create({ name: "Dogs" })`;
  // execute the query
  const collectionResponse = await client.query(collectionQuery);

  // define some data in your app
  const dog = { name: "Scout" };

  // query using your app's local variables
  const documentQuery = fql`
    Dogs.create(${dog}) {
      id,
      ts,
      name
    }
  `;

  // execute the query
  const response = await client.query(documentQuery);
} catch (error) {
  if (error instanceof FaunaError) {
    // handle errors
  }
} finally {
  // clean up any remaining resources
  client.close();
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
  - Current - v20
  - LTS - v18
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
import { Client, fql } from "fauna";

const client = new Client();

// Variables can be used as arguments in an FQL query
const collectionName = "Pets";

// a reusable sub-query to determine if a collection exists
const collectionExists = (name) => fql`Collection.byName(${name}) != null`;

// define a new query that uses the prior sub-query
const upsertCollectionQuery = fql`
  if (${collectionExists(collectionName)}) {
    "Collection exists!"
  } else {
    Collection.create({ name: ${collectionName} })
    "Collection exists now!"
  }
`;

// execute the query
const response = await client.query(upsertCollectionQuery);

client.close();
```

This has several advantages:

- You can use `fql` to build a library of subqueries applicable to your domain - and combinable in whatever way you need
- Injection attacks are not possible if you pass input variables into the interpolated (`` `${interpoloated_argument}` ``) parts of the query.
- The driver speaks "pure" FQL - you can try out some FQL queries on the dashboard's terminal and paste it directly into your app like `` fql`copied from terminal...`  `` and the query will work as is.

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
import { Client, fql } from "fauna";

const client = new Client();

type User = {
  name: string;
  email: string;
};

const query = fql`{
  name: "Alice",
  email: "alice@site.example",
}`;

const response: QuerySuccess<User> = await client.query<User>(query);
const user_doc: User = response.data;

console.assert(user_doc.name === "Alice");
console.assert(user_doc.email === "alice@site.example");

client.close();
```

## Query Options

Options are available to configure queries on each request.

```typescript
import { fql, Client, type QueryOptions } from "fauna";

const client = new Client();

const options: QueryOptions = {
  arguments: { name: "Alice" },
  format: "tagged",
  long_type: "number",
  linearized: false,
  max_contention_retries: 5,
  query_tags: { name: "readme_query" },
  query_timeout_ms: 60_000,
  traceparent: "00-750efa5fb6a131eb2cf4db39f28366cb-000000000000000b-00",
  typecheck: true,
};

const response = await client.query(fql`"Hello, #{name}!"`, options);

client.close();
```

## Client Configuration

The driver use's a default ClientConfiguration. We recommend most users stick with the defaults.

If your environment needs different configuration however, the default ClientConfiguration can be overridden.

Furthermore, on each request you can provide query specific configuration that will override the setting in your client for that request only.

```typescript
import { Client, endpoints, type ClientConfiguration } from "fauna";

const config: ClientConfiguration = {
  // configure client
  client_timeout_buffer_ms: 5000,
  endpoint: endpoints.default,
  fetch_keepalive: false,
  http2_max_streams: 100,
  http2_session_idle_ms: 5000,
  secret: YOUR_FAUNA_SECRET,

  // set default query options
  format: "tagged",
  long_type: "number",
  linearized: false,
  max_contention_retries: 5,
  query_tags: { name: "readme query" },
  query_timeout_ms: 60_000,
  traceparent: "00-750efa5fb6a131eb2cf4db39f28366cb-000000000000000b-00",
  typecheck: true,
};

const client = new Client(config);
```

### Timeouts

There are a few different timeout settings that can be configured; each comes with a default setting. We recommend that most applications simply stick to the defaults.

#### Query Timeout

The query timeout is the time, in milliseconds, that Fauna will spend executing your query before aborting with a 503 Timeout error. If a query timeout occurs, the driver will throw an instance of `ServiceTimeoutError`.

The query timeout can be set using the `ClientConfiguration.query_timeout_ms` option. The default value if you do not provide one is 5000 ms (5 seconds).

```javascript
const client = new Client({ query_timeout_ms: 20_000 });
```

The query timeout can also be set to a different value for each query using the `QueryOptions.query_timeout_ms` option. Doing so overrides the client configuration when performing this query.

```javascript
const response = await client.query(myQuery, { query_timeout_ms: 20_000 });
```

#### Client Timeout

The client timeout is the time, in milliseconds, that the client will wait for a network response before canceling the request. If a client timeout occurs, the driver will throw an instance of `NetworkError`.

The client timeout is always the query timeout plus an additional buffer. This ensures that the client always waits for at least as long Fauna could work on your query and account for network latency. The client timeout buffer is configured by setting the `client_timeout_buffer_ms` option. The default value for the buffer if you do not provide on is 5000 ms (5 seconds), therefore the default client timeout is 10000 ms (10 s) when considering the default query timeout.

```javascript
const client = new Client({ client_timeout_buffer_ms: 6000 });
```

#### HTTP/2 Session Idle Timeout

The HTTP/2 session idle timeout is the time, in milliseconds, that an HTTP/2 session will remain open after there is no more pending communication. Once the session idle time has elapsed the session is considered idle and the session is closed. Subsequent requests will create a new session; the session idle timeout does not result in an error.

Configure the HTTP/2 session idle timeout using the `http2_session_idle_ms` option. The default value if you do not provide one is 5000 ms (5 seconds).

This setting only applies to clients using HTTP/2 implementations; for example, the default client for Node.js runtimes.

```javascript
const client = new Client({ http2_session_idle_ms: 6000 });
```

> **Note**
> Your application process may continue executing after all requests are completed for the duration of the session idle timeout. To prevent this, it is recommended to call `Client.close()` once all requests are complete. It is not recommended to set `http2_session_idle_ms` to small values.

> **Warning**
> Setting `http2_session_idle_ms` to small values can lead to a race condition where requests cannot be transmitted before the session is closed, yielding `ERR_HTTP2_GOAWAY_SESSION` errors.

### Using environment variables

The driver will default to configuring your client with the values of the `FAUNA_SECRET` and `FAUNA_ENDPOINT` environment variable.

For example, if you set the following environment variables:

```shell
export FAUNA_SECRET=YOUR_FAUNA_SECRET
export FAUNA_ENDPOINT=https://db.fauna.com/
```

you can create a client without additional options

```javascript
const client = new Client();
```

## Query Statistics

Query statistics are returned with successful query responses and `ServiceError`s.

````typescript
import {
  fql,
  Client,
  ServiceError,
  type QueryInfo,
  type QueryStats,
  type QuerySuccess,
} from "fauna";

const client = new Client();

try {
  const response: QuerySuccess<string> = await client.query<string>(
    fql`"Hello world"`
  );
  const stats: QueryStats | undefined = response.stats;
  console.log(stats);
} catch (error: any) {
  if (error instanceof ServiceError) {
    const info: QueryInfo = error.queryInfo;
    const stats: QueryStats | undefined = info.stats;
  }
}

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
