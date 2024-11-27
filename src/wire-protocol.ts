import { QueryArgumentObject } from "./query-builder";
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
  StreamToken,
  TimeStub,
} from "./values";

/**
 * A request to make to Fauna.
 */
export interface QueryRequest<
  T extends string | QueryInterpolation = string | QueryInterpolation,
> {
  /** The query */
  query: T;

  /** Optional arguments. Variables in the query will be initialized to the
   * value associated with an argument key.
   */
  arguments?: EncodedObject;
}

/**
 * Options for queries. Each query can be made with different options. Settings here
 * take precedence over those in {@link ClientConfiguration}.
 */
export interface QueryOptions {
  /** Optional arguments. Variables in the query will be initialized to the
   * value associated with an argument key.
   */
  arguments?: QueryArgumentObject;

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
   * Controls what Javascript type to deserialize {@link https://docs.fauna.com/fauna/current/reference/fql_reference/types#long | Fauna longs} to.
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

  /**
   * Enable or disable performance hints. Defaults to disabled.
   * The QueryInfo object includes performance hints in the `summary` field, which is a
   * top-level field in the response object.
   * Overrides the optional setting on the {@link ClientConfiguration}.
   */
  performance_hints?: boolean;

  /**
   * Secret to use instead of the client's secret.
   */
  secret?: string;
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
  /** The number query attempts made due to retryable errors. */
  attempts: number;
  /**
   * A list of rate limits hit.
   * Included with QueryFailure responses when the query is rate limited.
   */
  rate_limits_hit?: ("read" | "write" | "compute")[];
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

/**
 * A decoded response from a successful query to Fauna
 */
export type QuerySuccess<T extends QueryValue> = QueryInfo & {
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
 * A decoded response from a failed query to Fauna. Integrations which only want to report a human
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
  paths?: Array<Array<number | string>>;
};

export type QueryResponse<T extends QueryValue> =
  | QuerySuccess<T>
  | QueryFailure;

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
export type QueryInterpolation =
  | FQLFragment
  | ValueFragment
  | ObjectFragment
  | ArrayFragment;

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
 *  { "fql": [{ "value": { "@int": "17" } }, " + 3"] }
 * ```
 */
export type ValueFragment = { value: TaggedType };

/**
 * A piece of an interpolated query that represents an object. Arguments
 * are passed to fauna using ObjectFragments so that query arguments can be
 * nested within javascript objects.
 *
 * ObjectFragments must always be encoded with tags, regardless of the
 * "x-format" request header sent.
 * @example
 * ```typescript
 *  const arg = { startDate: DateStub.from("2023-09-01") };
 *  const query = fql`${arg})`;
 *  // produces
 *  {
 *		"fql": [
 *			{
 *				"object": {
 *          "startDate": {
 *						"value": { "@date": "2023-09-01" } // Object field values have type QueryInterpolation
 *					}
 *				}
 *			}
 *		]
 *	}
 * ```
 */
export type ObjectFragment = { object: EncodedObject };

/**
 * A piece of an interpolated query that represents an array. Arguments
 * are passed to fauna using ArrayFragments so that query arguments can be
 * nested within javascript arrays.
 *
 * ArrayFragments must always be encoded with tags, regardless of the "x-format"
 * request header sent.
 * @example
 * ```typescript
 *  const arg = [1, 2];
 *  const query = fql`${arg})`;
 *  // produces
 *  {
 *		"fql": [
 *			{
 *				"array": [
 *					{ "value": { "@int": "1" } }, // Array items have type QueryInterpolation
 *					{ "value": { "@int": "2" } }
 *				]
 *			}
 *		]
 *	}
 * ```
 */
export type ArrayFragment = { array: TaggedType[] };

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
 *  { "fql": ["5 + ", { "fql": [{ "value": { "@int": "17" } }, " + 3"] }] }
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
 * A QueryValueObject is a plain javascript object where each value is a valid
 * QueryValue.
 * These objects can be returned in {@link QuerySuccess}.
 */
export interface QueryValueObject {
  [key: string]: QueryValue;
}

/**
 * A QueryValue represents the possible return values in a {@link QuerySuccess}.
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
  | Uint8Array
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
  | EmbeddedSet
  | StreamToken;

export type StreamRequest = {
  token: string;
  start_ts?: number;
  cursor?: string;
};

export type StreamEventType = "status" | "add" | "remove" | "update" | "error";
export type StreamEventStatus = {
  type: "status";
  txn_ts: number;
  cursor: string;
  stats: QueryStats;
};
export type StreamEventData<T extends QueryValue> = {
  type: "add" | "remove" | "update";
  txn_ts: number;
  cursor: string;
  stats: QueryStats;
  data: T;
};
export type StreamEventError = { type: "error" } & QueryFailure;
export type StreamEvent<T extends QueryValue> =
  | StreamEventStatus
  | StreamEventData<T>
  | StreamEventError;

export type FeedRequest = StreamRequest & {
  page_size?: number;
};

export type FeedSuccess<T extends QueryValue> = {
  events: (StreamEventData<T> | StreamEventError)[];
  cursor: string;
  has_next: boolean;
  stats?: QueryStats;
};

export type FeedError = QueryFailure;

export type TaggedBytes = { "@bytes": string };
export type TaggedDate = { "@date": string };
export type TaggedDouble = { "@double": string };
export type TaggedInt = { "@int": string };
export type TaggedLong = { "@long": string };
export type TaggedMod = { "@mod": string };
export type TaggedObject = { "@object": QueryValueObject };
export type TaggedRef = {
  "@ref": { id: string; coll: TaggedMod } | { name: string; coll: TaggedMod };
};
// WIP: core does not accept `@set` tagged values
// type TaggedSet = { "@set": { data: QueryValue[]; after?: string } };
export type TaggedTime = { "@time": string };

export type EncodedObject = { [key: string]: TaggedType };

export type TaggedType =
  | string
  | boolean
  | null
  | EncodedObject
  | TaggedBytes
  | TaggedDate
  | TaggedDouble
  | TaggedInt
  | TaggedLong
  | TaggedMod
  | TaggedObject
  | TaggedRef
  | TaggedTime
  | TaggedType[];
