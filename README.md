# Official JavaScript Driver for [Fauna v10](https://fauna.com) (current)

[![npm Version](https://img.shields.io/npm/v/fauna.svg?maxAge=21600)](https://www.npmjs.com/package/fauna)
[![License](https://img.shields.io/badge/license-MPL_2.0-blue.svg?maxAge=2592000)](https://raw.githubusercontent.com/fauna/fauna-js/main/LICENSE)

This driver can only be used with FQL v10, and is not compatible with earlier versions of FQL. To query your databases with earlier API versions, see the [faunadb](https://www.npmjs.com/package/faunadb) package.

See the [Fauna Documentation](https://docs.fauna.com/fauna/current/) for additional information on how to configure and query your databases.

<details>
<summary>Table of Contents</summary>

- [Official JavaScript Driver for Fauna v10 (current)](#official-javascript-driver-for-fauna-v10-current)
  - [Supported runtimes](#supported-runtimes)
  - [API reference](#api-reference)
  - [Install](#install)
  - [Usage](#usage)
    - [Write FQL queries](#write-fql-queries)
    - [Typescript support](#typescript-support)
      - [Interfaces as `QueryValue` responses](#interfaces-as-queryvalue-responses)
    - [Query options](#query-options)
    - [Query statistics](#query-statistics)
  - [Pagination](#pagination)
  - [Client configuration](#client-configuration)
    - [Environment variables](#environment-variables)
    - [Retry](#retry)
      - [Max attempts](#max-attempts)
      - [Max backoff](#max-backoff)
    - [Timeouts](#timeouts)
      - [Query timeout](#query-timeout)
      - [Client timeout](#client-timeout)
      - [HTTP/2 session idle timeout](#http2-session-idle-timeout)
  - [Event Feeds](#event-feeds)
    - [Request an Event Feed](#request-an-event-feed)
    - [Iterate on an Event Feed](#iterate-on-an-event-feed)
    - [Error handling](#error-handling)
    - [Event Feed options](#event-feed-options)
  - [Event Streaming](#event-streaming)
    - [Start a stream](#start-a-stream)
    - [Iterate on a stream](#iterate-on-a-stream)
    - [Close a stream](#close-a-stream)
    - [Stream options](#stream-options)
  - [Contributing](#contributing)
    - [Set up the repo](#set-up-the-repo)
    - [Run tests](#run-tests)
    - [Asserting types](#asserting-types)
    - [Lint your code](#lint-your-code)
  - [License](#license)

</details>

## Supported runtimes

**Server-side**

Node.js - [Current and active LTS versions](https://nodejs.org/en/about/releases/):

- Current - v22
- LTS - v20
- LTS (Maintenance) - v18

**Cloud providers**

- Cloudflare Workers
- AWS Lambda
- Netlify
- Vercel

**Browsers**

Stable versions of:

- Chrome 69+
- Firefox 62+
- Safari 12.1+
- Edge 79+

## API reference

API reference documentation for the driver is available at
https://fauna.github.io/fauna-js/. The docs are generated using
[TypeDoc](https://typedoc.org/).

## Install

The driver is available on [npm](https://www.npmjs.com/package/fauna). You
can install it using your preferred package manager. For example:

```shell
npm install fauna
```

Browsers can import the driver using a CDN link:

```html
<script type="module">
  import * as fauna from "https://cdn.jsdelivr.net/npm/fauna@latest/dist/browser/index.js";
</script>
```

## Usage

By default, the driver's `Client` instance authenticates with Fauna using an
access token in the `FAUNA_SECRET` environment variable. If needed, you can pass
the token to the client using the `secret` argument instead.

```javascript
import { Client, fql, FaunaError } from "fauna";
// Use `require` for CommonJS:
// const { Client, fql, FaunaError } = require('fauna');

const client = new Client();
// To configure your client:
// const client = new Client({
//   secret: YOUR_FAUNA_SECRET,
// });

try {
  // Build a query using the `fql` method
  const collectionQuery = fql`Collection.create({ name: "Dogs" })`;
  // Run the query
  const collectionResponse = await client.query(collectionQuery);

  // Declare a var for app data
  const dog = { name: "Scout" };

  // Build a query using the var
  const documentQuery = fql`
    Dogs.create(${dog}) {
      id,
      ts,
      name
    }
  `;

  // Run the query
  const response = await client.query(documentQuery);
  console.log(response);
} catch (error) {
  if (error instanceof FaunaError) {
    console.log(error);
  }
} finally {
  // Clean up any remaining resources
  client.close();
}
```

### Write FQL queries

The `fql` function is your gateway to building safe, reuseable Fauna queries.

It allows you compose queries from sub-queries and variables native to your program. Variables passed in are treated as unexecutable values in Fauna's API - preventing security issues like injection attacks.

For example:

```javascript
import { Client, fql } from "fauna";

const client = new Client();

// Variables can be used as arguments in an FQL query
const collectionName = "Pets";

// Build a reusable sub-query to determine if a collection exists
const collectionExists = (name) => fql`Collection.byName(${name}) != null`;

// Build query that uses the previous var and sub-query
const upsertCollectionQuery = fql`
  if (${collectionExists(collectionName)}) {
    "Collection already exists"
  } else {
    Collection.create({ name: ${collectionName} })
    "Collection created"
  }
`;

// Run the query
const response = await client.query(upsertCollectionQuery);
console.log(response.data);

client.close();
```

This has several advantages:

- You can use `fql` to build a library of subqueries applicable to your domain - and combinable in whatever way you need
- Injection attacks are not possible if you pass input variables into the interpolated (`` `${interpoloated_argument}` ``) parts of the query.
- The driver speaks "pure" FQL - you can try out some FQL queries on the dashboard's terminal and paste it directly into your app like ``fql`copied from terminal...` `` and the query will work as is.

### Typescript support

With TypeScript, you can apply a type parameter to your result.

```typescript
import { fql, Client, type QuerySuccess } from "fauna";

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
const userDoc: User = response.data;

console.assert(userDoc.name === "Alice");
console.assert(userDoc.email === "alice@site.example");

client.close();
```

Alternatively, you can apply a type parameter directly to your
fql statements and `Client` methods will infer your return types.
Due to backwards compatibility, if a type parameter is provided to
`Client` methods, it will override the inferred type from your
query.

```typescript
const query = fql<User>`{
  name: "Alice",
  email: "alice@site.example",
}`;

// response will be typed as QuerySuccess<User>
const response = await client.query(query);

// userDoc will be automatically inferred as User
const userDoc = response.data;

console.assert(userDoc.name === "Alice");
console.assert(userDoc.email === "alice@site.example");

client.close();
```

#### Interfaces as `QueryValue` responses

To use a custom interface as a query response, extend the `QueryValueObject`
interface.

```typescript
interface User extends QueryValueObject {
  name: string;
  email: string;
}

const query = fql`{
  name: "Alice",
  email: "alice@site.example",
}`;

const response: QuerySuccess<User> = await client.query<User>(query);
```

### Query options

Options are available to configure queries on each request. These override any
default query options in the [client configuration](#client-configuration).

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
console.log(response.data);

client.close();
```

### Query statistics

Query statistics are returned with successful query responses and errors of
the `ServiceError` type.

```typescript
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
    fql`"Hello world"`,
  );
  const stats: QueryStats | undefined = response.stats;
  console.log(stats);
} catch (error: any) {
  if (error instanceof ServiceError) {
    const info: QueryInfo = error.queryInfo;
    const stats: QueryStats | undefined = info.stats;
  }
}
```

Example output:

```javascript
{
  compute_ops: 1,
  read_ops: 0,
  write_ops: 0,
  query_time_ms: 15,
  storage_bytes_read: 0,
  storage_bytes_write: 0,
  contention_retries: 0
}
```

## Pagination

Use `paginate()` to iterate sets that contain more than one page of results.

`paginate()` accepts the same [query options](#query-options) as
`query()`.

```typescript
import { fql, Client, type SetIterator, type QueryValue } from "fauna";

const client = new Client();

// Adjust `pageSize()` size as needed.
const query = fql`
  Product
    .byName("limes")
    .pageSize(60) { description }`;

const options = {
  query_timeout_ms: 60_000,
};

const pages: SetIterator<QueryValue> = client.paginate(query, options);

for await (const products of pages) {
  for (const product of products) {
    console.log(product);
  }
}

client.close();
```

Use `flatten()` to get paginated results as a single, flat array:

```typescript
const pages: SetIterator<QueryValue> = client.paginate(query, options);

for await (const product of pages.flatten()) {
  console.log(product);
}
```

## Client configuration

The driver's `Client` instance comes with reasonable defaults that should be
used in most cases. You can override these defaults if needed.

In addition to configuring the client, you can also set default [query
options](#query-options).

```typescript
import { Client, endpoints, type ClientConfiguration } from "fauna";

const config: ClientConfiguration = {
  // Configure the client
  client_timeout_buffer_ms: 5000,
  endpoint: endpoints.default,
  fetch_keepalive: false,
  http2_max_streams: 100,
  http2_session_idle_ms: 5000,
  secret: YOUR_FAUNA_SECRET,

  // Set default query options
  format: "tagged",
  long_type: "number",
  linearized: false,
  max_attempts: 3,
  max_backoff: 20,
  max_contention_retries: 5,
  query_tags: { name: "readme_query" },
  query_timeout_ms: 60_000,
  traceparent: "00-750efa5fb6a131eb2cf4db39f28366cb-000000000000000b-00",
  typecheck: true,
};

const client = new Client(config);
```

### Environment variables

The driver will default to configuring your client with the values of the `FAUNA_SECRET` and `FAUNA_ENDPOINT` environment variable.

For example, if you set the following environment variables:

```shell
export FAUNA_SECRET=YOUR_FAUNA_SECRET
export FAUNA_ENDPOINT=https://db.fauna.com/
```

You can initalize the client with a default configuration:

```javascript
const client = new Client();
```

### Retry

#### Max attempts

The maximum number of times a query will be attempted if a retryable exception is thrown (ThrottlingError). Default 3, inclusive of the initial call. The retry strategy implemented is a simple exponential backoff.

To disable retries, pass max_attempts less than or equal to 1.

#### Max backoff

The maximum backoff in seconds to be observed between each retry. Default 20 seconds.

### Timeouts

There are a few different timeout settings that can be configured; each comes with a default setting. We recommend that most applications simply stick to the defaults.

#### Query timeout

The query timeout is the time, in milliseconds, that Fauna will spend executing your query before aborting with a 503 Timeout error. If a query timeout occurs, the driver will throw an instance of `QueryTimeoutError`.

The query timeout can be set using the `query_timeout_ms` client configuration option. The default value if you do not provide one is 5000 ms (5 seconds).

```javascript
const client = new Client({ query_timeout_ms: 20_000 });
```

The query timeout can also be set to a different value for each query using the
`query_timeout_ms` query option. Doing so overrides the client configuration
when performing this query.

```javascript
const response = await client.query(myQuery, { query_timeout_ms: 20_000 });
```

#### Client timeout

The client timeout is the time, in milliseconds, that the client will wait for a network response before canceling the request. If a client timeout occurs, the driver will throw an instance of `NetworkError`.

The client timeout is always the query timeout plus an additional buffer. This ensures that the client always waits for at least as long Fauna could work on your query and account for network latency. The client timeout buffer is configured by setting the `client_timeout_buffer_ms` option. The default value for the buffer if you do not provide on is 5000 ms (5 seconds), therefore the default client timeout is 10000 ms (10 s) when considering the default query timeout.

```javascript
const client = new Client({ client_timeout_buffer_ms: 6000 });
```

#### HTTP/2 session idle timeout

The HTTP/2 session idle timeout is the time, in milliseconds, that an HTTP/2 session will remain open after there is no more pending communication. Once the session idle time has elapsed the session is considered idle and the session is closed. Subsequent requests will create a new session; the session idle timeout does not result in an error.

Configure the HTTP/2 session idle timeout using the `http2_session_idle_ms` option. The default value if you do not provide one is 5000 ms (5 seconds).

This setting only applies to clients using HTTP/2 implementations; for example, the default client for Node.js runtimes.

```javascript
const client = new Client({ http2_session_idle_ms: 6000 });
```

> **Note**
> Your application process may continue executing after all requests are completed for the duration of the session idle timeout. To prevent this, it is recommended to call `close()` once all requests are complete. It is not recommended to set `http2_session_idle_ms` to small values.

> **Warning**
> Setting `http2_session_idle_ms` to small values can lead to a race condition where requests cannot be transmitted before the session is closed, yielding `ERR_HTTP2_GOAWAY_SESSION` errors.

## Event Feeds

The driver supports [Event Feeds](https://docs.fauna.com/fauna/current/learn/cdc/#event-feeds).

### Request an Event Feed

An Event Feed asynchronously polls an [event source](https://docs.fauna.com/fauna/current/learn/cdc/#create-an-event-source) for events.

To get an event source, append `eventSource()` or `eventsOn()` to a
[supported Set](https://docs.fauna.com/fauna/current/reference/streaming_reference/#sets).

To get paginated events, pass the event source to `feed()`:

```javascript
const response = await client.query(fql`
  let set = Product.all()

  {
    initialPage: set.pageSize(10),
    eventSource: set.eventSource()
  }
`);
const { initialPage, eventSource } = response.data;

const feed = client.feed(eventSource);
```

If changes occur between the creation of the event source and the `feed()`
request, the feed replays and emits any related events.

You can also pass a query that produces an event source directly to `feed()`:

```javascript
const query = fql`Product.all().eventsOn(.price, .stock)`;

const feed = client.feed(query);
```

If you pass an event source query to `feed()`, the driver creates the event
source and requests the event feed at the same time.

### Iterate on an Event Feed

`feed()` returns a `FeedClient` instance that can act as an `AsyncIterator`. You can use `for await...of` to iterate through all the pages:

```ts
const query = fql`Product.all().eventsOn(.price, .stock)`;
const feed = client.feed(query);

for await (const page of feed) {
  console.log("Page stats", page.stats);

  for (event in page.events) {
    switch (event.type) {
      case "update":
      case "add":
      case "remove":
        console.log("Event: ", event);
        // ...
        break;
    }
  }
}
```

Alternatively, use `flatten()` to get paginated results as a single, flat array:

```ts
const query = fql`Product.all().eventsOn(.price, .stock)`;
const feed = client.feed(query);

for await (const event of feed.flatten()) {
  console.log("Event: ", event);
}
```

### Error handling

Exceptions can be raised at two different places:

1. While fetching a page
1. While iterating a page's events

This distinction allows for you to ignore errors originating from event processing.
For example:

```ts
const feed = client.feed(fql`
  Product.all().map(.details.toUpperCase()).eventSource()
`);

try {
  for await (const page of feed) {
    // Pages will stop at the first error encountered.
    // Therefore, its safe to handle an event failures
    // and then pull more pages.
    try {
      for (const event of page.events) {
        console.log("Event: ", event);
      }
    } catch (error: unknown) {
      console.log("Feed event error: ", error);
    }
  }
} catch (error: unknown) {
  console.log("Non-retryable error: ", error);
}
```

### Event Feed options

The client configuration sets the default options for `feed()`. You can pass a `FeedClientConfiguration` object to override these defaults:

```ts
const options: FeedClientConfiguration = {
  long_type: "number",
  max_attempts: 5,
  max_backoff: 1000,
  query_timeout_ms: 5000,
  client_timeout_buffer_ms: 5000,
  secret: "FAUNA_SECRET",
  cursor: undefined,
  start_ts: undefined,
};

client.feed(fql`Product.all().eventSource()`, options);
```

You can reuse
[cursors](https://docs.fauna.com/fauna/current/reference/cdc/#get-events-after-a-specific-cursor)
across event sources with identical queries in the same database.

## Event Streaming

The driver supports [Event Streaming](https://docs.fauna.com/fauna/current/learn/streaming).

### Start a stream

To get an event source, append
[`eventSource()`](https://docs.fauna.com/fauna/current/reference/reference/schema_entities/set/eventsource)
or
[`eventsOn()`](https://docs.fauna.com/fauna/current/reference/reference/schema_entities/set/eventson)
to a set from a [supported
source](https://docs.fauna.com/fauna/current/reference/streaming_reference/#sets).

To start and subscribe to the stream, pass the event source to `stream()`:

```javascript
const response = await client.query(fql`
  let set = Product.all()

  {
    initialPage: set.pageSize(10),
    eventSource: set.eventSource()
  }
`);
const { initialPage, eventSource } = response.data;

client.stream(eventSource);
```

You can also pass a query that produces an event source directly to `stream()`:

```javascript
const query = fql`Product.all().eventsOn(.price, .stock)`;

client.stream(query);
```

### Iterate on a stream

You can iterate on the stream using an async loop:

```javascript
try {
  for await (const event of stream) {
    switch (event.type) {
      case "update":
      case "add":
      case "remove":
        console.log("Event: ", event);
        // ...
        break;
    }
  }
} catch (error) {
  // An error will be handled here if Fauna returns a terminal, "error" event, or
  // if Fauna returns a non-200 response when trying to connect, or
  // if the max number of retries on network errors is reached.
  // ... handle fatal error
}
```

Or you can use a callback function:

```javascript
stream.start(
  function onEvent(event) {
    switch (event.type) {
      case "update":
      case "add":
      case "remove":
        console.log("Event: ", event);
        // ...
        break;
    }
  },
  function onFatalError(error) {
    // An error will be handled here if Fauna returns a terminal, "error" event, or
    // if Fauna returns a non-200 response when trying to connect, or
    // if the max number of retries on network errors is reached.
    // ... handle fatal error
  },
);
```

### Close a stream

Use `close()` to close a stream:

```javascript
const stream = await client.stream(fql`Product.all().eventSource()`);

let count = 0;
for await (const event of stream) {
  console.log("Event: ", event);
  // ...
  count++;

  // Close the stream after 2 events
  if (count === 2) {
    stream.close();
    break;
  }
}
```

### Stream options

The [client configuration](#client-configuration) sets default options for the
`stream()` method.

You can pass an `StreamClientConfiguration` object to override these defaults:

```javascript
const options: StreamClientConfiguration = {
  long_type: "number",
  max_attempts: 5,
  max_backoff: 1000,
  secret: "YOUR_FAUNA_SECRET",
  status_events: true,
  cursor: null,
};

client.stream(fql`Product.all().eventSource()`, options);
```

For supported properties, see
[StreamClientConfiguration](https://fauna.github.io/fauna-js/latest/types/StreamClientConfiguration.html)
in the API reference.

## Contributing

Any contributions from the community are greatly appreciated!

If you have a suggestion that would make this better, please fork the repo and create a pull request. You may also simply open an issue. We provide templates, so please complete those to the best of your ability.

Don't forget to give the project a star! Thanks again!

### Set up the repo

1. Clone the repository; e.g. `gh repo clone fauna/fauna-js` if you use the GitHub CLI
2. Install dependencies via `yarn install`

### Run tests

1. Start a docker desktop or other docker platform.
2. Run `yarn test`. This will start local fauna containers, verify they're up and run all tests.

### Asserting types

In cases where you are modifying types and need to test type enforcement, you can use `@ts-expect-error`. Using `@ts-expect-error` will supress any type errors on the following line. Conversely, if there's no error, TypeScript will report its usage as not being neccessary.

To learn more about `@ts-expect-error`, you can read more about it in the TypeScript [release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-9.html#-ts-expect-error-comments).

### Lint your code

Linting runs automatically on each commit.

If you wish to run on-demand run `yarn lint`.

## License

Distributed under the MPL 2.0 License. See [LICENSE](./LICENSE) for more information.
