## Table of Contents

1. [Development](#development)
1. [Quick Start](#quick-start-for-the-fql-x-driver)
1. [Learning how to use the Driver](#learning-how-to-use-the-fql-x-driver)
1. [Understanding the wire protocol](#understanding-the-fql-x-wire-protocol)

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

# Usage

The FQL X JS driver uses a template-based approach to composing queries and operations. The advantage of this design is that you can prototype and test your queries in the Fauna dashboard shell, and then cut-and-paste those queries as templates in your client, which are executed in Fauna via this driver. You can parameterize your query by adding placeholders to the template, and then pass a set of arguments to the query() method, or resolve the placeholders with string interpolation.

This driver can only be used with FQL X, and is not compatible with earlier versions of FQL. At time of alpha, FQL X is currently only served in Fauna's preview environment. This README contains detailed instructions on how to use the driver, split into the following sections .

# Quick Start for the FQL X driver

## Set-up and Dependencies

This driver is not yet hosted on npm. To use it in a toy app clone this repo and add a file system dependency from a node application.

For example: `yarn add file://path-to-your-clone`

## Pre-requisites

If you have not already created a database and access key (secret) in the Preview environment please do so now. Contact product@fauna.com for access to Preview.

## Creating a connection to your database

The following code example sets up a connection to Fauna's Preview environment, authenticates with the secret you provided, and executes a simple query.

```typescript
import { Client, endpoints, fql } from "fauna";

const client = new Client({
  endpoint: endpoints.preview,
  secret: "<my_fauna_secret>",
  query_timeout_ms: 60_000,
});
```

Default settings are available for the client. So you can creat a client as simply as:

```typescript
import { Client } from "fauna";

const client = new Client();
// secret defaults to whatever is stored in a FAUNA_SECRET environmental variable
// query_timeout_ms defaults to 60,000
// endpoint defaults to endpoints.cloud
```

Since you'll be running this demo against the Preview environment you'll need to at least override the endpoint:

```typescript
import { Client } from "fauna";

const client = new Client({ endpoint: endpoints.preview });
```

The following snippet uses the client object, just created in the previous example, to execute queries in Fauna.

```typescript
(async () => {
  try {
    var response = await client.query(fql`"Hello World!"`);
    console.log(response);
  } catch (e) {
    console.log(e);
  }
})();
```

## Export your secret as an environment variable

Rather than hard coding your secret into your code, the driver can load your secret automatically from a FAUNA_SECRET environment variable. Open a terminal and execute the following command:

`export FAUNA_SECRET=your-secret`

# Learning how to use the FQL X Driver

You can familiarize yourself with the driver by completing the exercises included in the demo directory of this repo. Additionally, the **Getting Started With the Driver** section of this README provides driver documentation, and the driver code itself is heavily documented. Information about Fauna service and the v10 API is available in the [FQL X alpha documentation](https://deploy-preview-1220--fauna-docs.netlify.app/fqlx/alpha/). So, feel free to proceed as works bests for you!

## Querying with your client

You can query using pure FQL X using the driver `fql` function. Each FQL X language driver exposes the FQL X language in the raw - there is no need to learn a new framework for each language.

Here's a basic example:

```typescript
const result = await client.query<string>(fql`
if ( 2 > 1 ) {
   "Hello World!"
}
`);
console.log(result);
// prints { data: "Hello World!", txn_ts: 1667174400000000 } // txn_ts will vary!
```

Note that with TypeScript you can apply a type parameter to your result. So querying with a type \<T\> you'll get a shape back like:

```(typescript)
{
  data: T,
  txn_ts: string
}
```

Note that FQL X cannot yet enforce that your persisted data conform to the \<T\> type. So at this time the type arguments are a convenience provided you know the shape of your data. If you do know the shape - using the type arguments will allow the rest of your code to be type safe.

You can also query with a `QueryRequest` that lets you directly use the wire protocol. The FQL X wire protocol allows for queries as strings with arguments that safely inject into the string, like parameterized queries in other database drivers. Here's an example:

```typescript
const result = await client.query<string>({
  query: '"Hello " + arg1',
  arguments: { arg1: "World!" },
});
console.log(result);
// prints { data: "Hello World!", txn_ts: 1667174400000000 } // txn_ts will vary!
```

You can also do that using the `fql` function! Like this:

```typescript
const greetee = "World!";
const result = await client.query<string>(fql`"Hello " + ${greetee}`);
console.log(result);
// prints { data: "Hello World!", txn_ts: 1667174400000000 } // txn_ts will vary!
```

This `fql` based query is identical to the first example - under the hood the driver will convert the `fql` input into a parameterized query composed of a string and arguments.

## Composing FQL X queries

The `fql` function allows you to compose FQL X from other FQL X snippets. It then automatically forms your input into a fully-formed and correct Fauna query.

Let's look at an example:

```typescript
// yields valid FQL X - can be used as a query or as part
// of a larger query.
function collectionExists(collectionName: string) {
  return fql`Collection.byName(${collectionName}) != null`;
}

let collectionName = "ComposedQuery";
// below, we compose a FQL X query that injects the FQL X
// generated by collectionExists
const result = await client.query(fql`
  if (${collectionExists(collectionName)}) {
    ${`${collectionName} exists!`}
  } else {
    Collection.create({ name: ${collectionName} })
  }
`);
console.log(result);
/**
Prints the following if the ComposedQuery collection does not yet exist:
{
  data: {
    name: 'ComposedQuery',
    _coll: 'Collection',
    _ts: '2022-11-02T17:45:04.060Z' // will vary
  },
  txn_ts: 1667411104060000 // will vary
}

Prints the following if ComposedQuery exists:
{
  data: 'ComposedQuery exists!',
  txn_ts: 1667411104060000 // will vary
}
*/
```

Again, under the hood this `fql` function and its inputs convert to a an argument-parameterized string query. So you can be confident in safety from "FQL X injection" bugs.

# Understanding The FQL X Wire Protocol

The FQL X API has a new http-based wire protol. Interactions with the wire protocol are modeled across five main types in the driver, each with a TypeScript type or class:

- `QueryRequest` - The form of a request. Exactly matches what Fauna accepts over the wire for FQL X.
- `QueryResponse` - The form of a successful response. Exactly matches what Fauna emits over the wire for FQL X.
- `QueryHeaders` - Headers you can include in requests to control the behavior and telemetry of a FQL X query.
- `ServiceError` and its children, and `ProtocolError` - The form of a non-successful response, which exactly matches what Fauna emits over the wire over FQL X.

In the following subsections, we will first explore use of QueryHeaders, and then follow with the error types: `ServiceError` and `ProtocolError`.

## Using additional query controls - QueryHeaders

`QueryHeaders` can be used to control request behavior such as _always using serializable_ or _always having a certain max_contention_retries to apply_. You can configure your Client object with a set of headers to be used on each request. Individual `QueryRequest` objects or `query` calls also accept `QueryHeaders` which override any default Client settings.

Valid header values are:

```typescript
export interface QueryRequestHeaders {
  /**
   * Determines the encoded format expected for the query `arguments` field, and
   * the `data` field of a successful response.
   */
  format?: ValueFormat;
  /**
   * The ISO-8601 timestamp of the last transaction the client has previously observed.
   * This client will track this by default, however, if you wish to override
   * this value for a given request set this value.
   */
  last_txn_ts?: number;
  /**
   * If true, unconditionally run the query as strictly serialized.
   * This affects read-only transactions. Transactions which write
   * will always be strictly serialized.
   * Overrides the optional setting for the client.
   */
  linearized?: boolean;
  /**
   * The timeout to use in this query in milliseconds.
   * Overrides the timeout for the client.
   */
  query_timeout_ms?: number;
  /**
   * The max number of times to retry the query if contention is encountered.
   * Overrides the optional setting for the client.
   */
  max_contention_retries?: number;

  /**
   * Tags provided back via logging and telemetry.
   * Overrides the optional setting on the client.
   */
  query_tags?: Record<string, string>;
  /**
   * A traceparent provided back via logging and telemetry.
   * Must match format: https://www.w3.org/TR/trace-context/#traceparent-header
   * Overrides the optional setting for the client.
   */
  traceparent?: string;
}
```

The following example shows how to set the `linearized` and `max_contention_retries` headers object to a Client instance:

```typescript
const client = new Client({
  endpoint: endpoints.preview,
  secret,
  query_timeout_ms: 60_000,
  linearized: true,
  max_contention_retries: 4,
});
```

You can override Client defaults and attach headers to a request by:

```typescript
const headers = { linearized: true, max_contention_retries: 4 };
const result = await client.query<string>(
  fql`
if ( 2 > 1 ) {
   "Hello World!"
}
`,
  headers
);
console.log(result);
```

or, if you are using a QueryRequest rather than the `fql` function, by:

```typescript
let result = await client.query<string>({
  query: '"Hello " + arg1',
  arguments: { arg1: "World!" },
  linearized: true,
  max_contention_retries: 4,
});
console.log(result);
// or this
const headers = { linearized: true, max_contention_retries: 4 };
result = await client.query<string>(
  {
    query: '"Hello " + arg1',
    arguments: { arg1: "World!" },
  },
  headers
);
```

Each of these techniques has the same result. The headers you specify on the call to the client's `query` function will be applied, and anything you pass to the `query` function **takes precedence over default headers set in the ClientConfiguration** regardless of how you pass them.

## Handling errors

If your query has a problem, the client throws an `Error` instead of returning a query response.
The `Error` is **always** one of four classes:

- **ServiceError** and its children - Fauna threw an error. The error object contains fields that give you specifics.
- **ProtocolError** - An HTTP error was thrown that was not emitted by Fauna.
- **NetworkError** - The client experienced an issue with a network connection.
- **ClientError** - An unknown fault occurred in the client itself.

**ServiceError** and **ProtocolError** are errors exposed by the FQL X wire protocol. ServiceError (and its children encapsulate errors emitted directly from Fauna, and ProtocolError, which are errors that did not originate from Fauna, but do originate from the HTTP protocol Fauna uses.

**ClientError** and **NetworkError** are exposed by the driver. ClientError is due to a runtime error in the driver itself; and NetworkError which is due to a problem with network connections.

You can handle errors like this:

```typescript
try {
  await client.query(`bad query;`);
} catch (e) {
  if (e instanceof ServiceError) {
    // handle such errors
  } else if (e instanceof NetworkError) {
    // ..etc
  } // ..etc
}
```

See the driver code and documentation for more detailed information about errors.
