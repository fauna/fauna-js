# Headers

## X-Last-Seen-Txn

- Supports RYOW (read your own write) behavior for the client.
- the driver should auto-ship this, but allow opt out??

## X-Lineraized

- If true, unconditionally run the query as strictly serialized. This affects read-only transactions, as transactions which write will already be strictly serialized.

## X-Timeout-Ms

Client specified timeout, milliseconds.

## X-Max-Contention-Retries

The maximum number of times a transaction is allowed to retry due to concurrent contention failure before an error is returned.

## X-Request-Id

A string identifier for the request, which is controlled by the caller. Provided back via logging and telemetry.

Note - this disagrees with `traceparent` in the Querylogs work

# API

## POST /query/1

Executes an FQLx transaction.

Parameters:

```(typescript)
type Request = {
  query: string | QueryInterpolation;
  arguments?: JSONValue;
  last_txn?: string; // ISO-8601
  lineraized?: boolean;
  timeout_ms?: number;
  max_contention_retries?: number;
  request_id?: string;
}

type QueryInterpolation = {
  fql: string | QueryInterpolation;
} | {
  value: JSONValue;
} | {
  json: string;
}

type JSONValue =
    | string
    | number
    | boolean
    | { [x: string]: JSONValue }
    | Array<JSONValue>;
```
