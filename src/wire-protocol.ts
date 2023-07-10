// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { fql } from "./query-builder";
import {
  DateStub,
  Document,
  DocumentReference,
  EmbeddedSet,
  Module,
  NamedDocument,
  NamedDocumentReference,
  NullDocument,
  Page,
  TimeStub,
} from "./values";

/**
 * A request to make to Fauna.
 */
export interface QueryRequest {
  /** The query */
  query: string | QueryInterpolation;

  /** Optional arguments. Variables in the query will be initialized to the
   * value associated with an argument key.
   */
  arguments?: QueryValueObject;
}

/**
 * Options for queries. Each query can be made with different options. Settings here
 * take precedence over those in {@link ClientConfiguration}.
 */
export interface QueryOptions {
  /** Optional arguments. Variables in the query will be initialized to the
   * value associated with an argument key.
   */
  arguments?: QueryValueObject;

  /**
   * Determines the encoded format expected for the query `arguments` field, and
   * the `data` field of a successful response.
   * Overrides the optional setting on the {@link ClientConfiguration}.
   */
  format?: ValueFormat;

  /**
   * If true, unconditionally run the query as strictly serialized.
   * This affects read-only transactions. Transactions which write
   * will always be strictly serialized.
   * Overrides the optional setting on the {@link ClientConfiguration}.
   */
  linearized?: boolean;

  /**
   * Controls what Javascript type to deserialize {@link https://fqlx-beta--fauna-docs.netlify.app/fqlx/beta/reference/language/types#long | Fauna longs} to.
   * Use 'number' to deserialize longs to number. Use 'bigint' to deserialize to bigint. Defaults to 'number'.
   * Note, for extremely large maginitude numbers Javascript's number will lose precision; as Javascript's
   * 'number' can only support +/- 2^53-1 whereas Fauna's long is 64 bit. If this is detected, a warning will
   * be logged to the console and precision loss will occur.
   * If your application uses extremely large magnitude numbers use 'bigint'.
   */
  long_type?: "number" | "bigint";

  /**
   * The max number of times to retry the query if contention is encountered.
   *Overrides the optional setting on the {@link ClientConfiguration}.
   */
  max_contention_retries?: number;

  /**
   * Tags provided back via logging and telemetry.
   * Overrides the optional setting on the {@link ClientConfiguration}.
   */
  query_tags?: Record<string, string>;

  /**
   * The timeout to use in this query in milliseconds.
   * Overrides the optional setting on the {@link ClientConfiguration}.
   */
  query_timeout_ms?: number;

  /**
   * A traceparent provided back via logging and telemetry.
   * Must match format: https://www.w3.org/TR/trace-context/#traceparent-header
   * Overrides the optional setting on the {@link ClientConfiguration}.
   */
  traceparent?: string;

  /**
   * Enable or disable typechecking of the query before evaluation. If no value
   * is provided, the value of `typechecked` in the database configuration will
   * be used.
   * Overrides the optional setting on the {@link ClientConfiguration}.
   */
  typecheck?: boolean;
}

/**
 * tagged declares that type information is transmitted and received by the driver.
 * "simple" indicates it is not - pure JSON is used.
 * "decorated" will cause the service output to be shown in FQL syntax that could
 * hypothetically be used to query Fauna. This is intended to support CLI and
 * REPL like tools.
 * @example
 * ```typescript
 * // example of decorated output
 * { time: Time("2012-01-01T00:00:00Z") }
 * ```
 */
export declare type ValueFormat = "simple" | "tagged" | "decorated";

export type QueryStats = {
  /** The amount of Transactional Compute Ops consumed by the query. */
  compute_ops: number;
  /** The amount of Transactional Read Ops consumed by the query. */
  read_ops: number;
  /** The amount of Transactional Write Ops consumed by the query. */
  write_ops: number;
  /** The query run time in milliseconds. */
  query_time_ms: number;
  /** The amount of data read from storage, in bytes. */
  storage_bytes_read: number;
  /** The amount of data written to storage, in bytes. */
  storage_bytes_write: number;
  /** The number of times the transaction was retried due to write contention. */
  contention_retries: number;
};

export type QueryInfo = {
  /** The last transaction timestamp of the query. A Unix epoch in microseconds. */
  txn_ts?: number;
  /** The schema version that was used for the query execution. */
  schema_version?: number;
  /** A readable summary of any warnings or logs emitted by the query. */
  summary?: string;
  /** The value of the x-query-tags header, if it was provided. */
  query_tags?: Record<string, string>;
  /** Stats on query performance and cost */
  stats?: QueryStats;
};

export type QuerySuccess<T> = QueryInfo & {
  /**
   * The result of the query. The data is any valid JSON value.
   * @remarks
   * data is type parameterized so that you can treat it as a
   * certain type if you are using typescript.
   */
  data: T;
  /** The query's inferred static result type. */
  static_type?: string;
};

/**
 * A failed query response. Integrations which only want to report a human
 * readable version of the failure can simply print out the "summary" field.
 */
export type QueryFailure = QueryInfo & {
  /**
   * The result of the query resulting in
   */
  error: {
    /** A predefined code which indicates the type of error. See XXX for a list of error codes. */
    code: string;
    /** A short, human readable description of the error */
    message: string;
    /**
     * A machine readable description of any constraint failures encountered by the query.
     * Present only if this query encountered constraint failures.
     */
    constraint_failures?: Array<ConstraintFailure>;
    /**
     * The user provided value passed to the originating `abort()` call.
     * Present only when the query encountered an `abort()` call, which is
     * denoted by the error code `"abort"`
     */
    abort?: QueryValue;
  };
};

/**
 * A constraint failure triggered by a query.
 */
export type ConstraintFailure = {
  /** Description of the constraint failure */
  message: string;
  /** Name of the failed constraint */
  name?: string;
  /** Path into the write input data to which the failure applies */
  paths?: Array<number | string>;
};

export type QueryResponse<T> = QuerySuccess<T> | QueryFailure;

export const isQuerySuccess = (res: any): res is QuerySuccess<any> =>
  res instanceof Object && "data" in res;

export const isQueryFailure = (res: any): res is QueryFailure =>
  res instanceof Object &&
  "error" in res &&
  res.error instanceof Object &&
  "code" in res.error &&
  "message" in res.error;

export const isQueryResponse = (res: any): res is QueryResponse<any> =>
  isQueryResponse(res) || isQueryFailure(res);

/**
 * A piece of an interpolated query. Interpolated queries can be safely composed
 * together without concern of query string injection.
 * @see {@link ValueFragment} and {@link FQLFragment} for additional
 * information
 */
export type QueryInterpolation = FQLFragment | ValueFragment;

/**
 * A piece of an interpolated query that represents an actual value. Arguments
 * are passed to fauna using ValueFragments so that query string injection is
 * not possible.
 * @remarks A ValueFragment is created by this driver when a literal value or
 * object is provided as an argument to the {@link fql} tagged template
 * function.
 *
 * ValueFragments must always be encoded with tags, regardless of the "x-format"
 * request header sent.
 * @example
 * ```typescript
 *  const num = 17;
 *  const query = fql`${num} + 3)`;
 *  // produces
 *  { fql: [{ value: { "@int": "17" } }, " + 3"] }
 * ```
 */
export type ValueFragment = { value: QueryValue };

/**
 * A piece of an interpolated query. Interpolated Queries can be safely composed
 * together without concern of query string injection.
 * @remarks A FQLFragment is created when calling the {@link fql} tagged
 * template function and can be passed as an argument to other Querys.
 * @example
 * ```typescript
 *  const num = 17;
 *  const query1 = fql`${num} + 3)`;
 *  const query2 = fql`5 + ${query1})`;
 *  // produces
 *  { fql: ["5 + ", { fql: [{ value: { "@int": "17" } }, " + 3"] }] }
 * ```
 */
export type FQLFragment = { fql: (string | QueryInterpolation)[] };

/**
 * A source span indicating a segment of FQL.
 */
export interface Span {
  /**
   * A string identifier of the FQL source. For example, if performing
   * a raw query against the API this would be *query*.
   */
  src: string;
  /**
   * The span's starting index within the src, inclusive.
   */
  start: number;
  /**
   * The span's ending index within the src, inclusive.
   */
  end: number;
  /**
   * The name of the enclosing function, if applicable.
   */
  function: string;
}

/**
 * A QueryValueObject is a plain javascript object where
 * each value is a QueryValue.
 * i.e. these objects can be set as values
 * in the {@link fql} query creation function and can be
 * returned in {@link QuerySuccess}.
 */
export type QueryValueObject = {
  [key: string]: QueryValue;
};

/**
 * A QueryValue can be sent as a value in a query,
 * and received from query output.
 * i.e. these are the types you can set as values
 * in the {@link fql} query creation function and can be
 * returned in {@link QuerySuccess}.
 */
export type QueryValue =
  // plain javascript values
  | null
  | string
  | number
  | bigint
  | boolean
  | QueryValueObject
  | Array<QueryValue>
  // client-provided classes
  | DateStub
  | TimeStub
  | Module
  | Document
  | DocumentReference
  | NamedDocument
  | NamedDocumentReference
  | NullDocument
  | Page<QueryValue>
  | EmbeddedSet;
