import { JSONValue } from ".";

/**
 * The result of a query to Fauna.
 * @see {@link QuerySuccess} and {@link QueryFailure} for additional information.
 */
export type QueryResponse<T extends JSONValue> = QuerySuccess<T> | QueryFailure;

export type QuerySuccess<T> = QueryInfo & {
  /**
   * The result of a successful query. The data is any valid JSON value.
   * @remarks
   * data is type parameterized so that you can treat it as a
   * certain type if you are using typescript.
   * @see {@link QueryInfo} for additional details
   */
  data: T;
  /** The query's inferred static result type. */
  static_type?: string;
};

/**
 * A failed query response. Integrations which only want to report a human
 * readable version of the failure can simply print out the "summary" field.
 * @see {@link QueryInfo} and {@link ConstraintFailure} for additional details
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

export type QueryInfo = {
  /** The last transaction timestamp of the query. A Unix epoch in microseconds. */
  txn_ts: number;
  /** A readable summary of any warnings or logs emitted by the query. */
  summary?: string;
  /** The value of the x-query-tags header, if it was provided. */
  query_tags: Record<string, string>;
  /** Stats on query performance and cost */
  stats: QueryStats;
};

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
  storage_bytes_written: number;
  /** The number of times the transaction was retried due to write contention. */
  contention_retries: number;
};

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
