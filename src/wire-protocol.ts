/**
 * A request to make to Fauna.
 */
export interface QueryRequest extends QueryRequestHeaders {
  /** The query. */
  query: string;

  /** Optional arguments if your query is interpolated. */
  arguments?: JSONObject;
}

export interface QueryRequestHeaders {
  /**
   * The ISO-8601 timestamp of the last transaction the client has previously observed.
   * This client will track this by default, however, if you wish to override
   * this value for a given request set this value.
   */
  last_txn?: string;
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
  timeout_ms?: number;
  /**
   * The max number of times to retry the query if contention is encountered.
   * Overrides the optional setting for the client.
   */
  max_contention_retries?: number;

  /**
   * Tags provided back via logging and telemetry.
   * Overrides the optional setting on the client.
   */
  tags?: { [key: string]: string };
  /**
   * A traceparent provided back via logging and telemetry.
   * Must match format: https://www.w3.org/TR/trace-context/#traceparent-header
   * Overrides the optional setting for the client.
   */
  traceparent?: string;
}

/**
 * A response to a query.
 * @remarks
 * The QueryResponse is type parameterized so that you can treat it as a
 * a certain type if you are using Typescript.
 */
export interface QueryResponse<T> {
  /**
   * The result of the query. The data is any valid JSON value.
   * @remarks
   * data is type parameterized so that you can treat it as a
   * certain type if you are using typescript.
   */
  data: T;
  /** Stats on query performance and cost */
  stats: { [key: string]: number };
  /** The last transaction time of the query. An ISO-8601 date string. */
  txn_time: string;
}

/**
 * An error representing a query failure returned by Fauna.
 */
export class ServiceError extends Error {
  /**
   * The HTTP Status Code of the error.
   */
  readonly httpStatus: number;
  /**
   * A code for the error. Codes indicate the cause of the error.
   * It is safe to write programmatic logic against the code. They are
   * part of the API contract.
   */
  readonly code: string;
  /**
   * A summary of the error in a human readable form. Only present
   * where message does not suffice.
   */
  readonly summary?: string;

  constructor(error: {
    code: string;
    message: string;
    httpStatus: number;
    summary?: string;
  }) {
    super(error.message);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ServiceError);
    }

    this.name = "ServiceError";
    this.code = error.code;
    this.httpStatus = error.httpStatus;
    if (error.summary) {
      this.summary = error.summary;
    }
  }
}

/**
 * An error response that is the result of the query failing during execution.
 * QueryRuntimeError's occur when a bug in your query causes an invalid execution
 * to be requested.
 * The 'code' field will vary based on the specific error cause.
 */
export class QueryRuntimeError extends ServiceError {
  constructor(error: {
    code: string;
    message: string;
    httpStatus: 400;
    summary?: string;
  }) {
    super(error);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, QueryRuntimeError);
    }
    this.name = "QueryRuntimeError";
    // TODO trace, txn_time, and stats not yet returned for QueryRuntimeError
    // flip to check for those rather than a specific code.
  }
}

/**
 * An error due to a "compile-time" check of the query
 * failing.
 */
export class QueryCheckError extends ServiceError {
  /**
   * An array of {@link QueryCheckFailure} conveying the root cause of an _invalid query_.
   * QueryCheckFailure are detected _before runtime_ - when your query is analyzed for correctness
   * prior to execution.
   * Present only for client-side problems caused by submitting malformed queries.
   * See {@link TODO} for a list of statsuCode and code associated with failures.
   * @example
   * ### This query is invalid as semicolons are not valid syntax.
   * ```
p   * "taco".length;
   * ```
   */
  readonly failures: Array<QueryCheckFailure>;

  constructor(error: {
    code: string;
    message: string;
    httpStatus: 400;
    summary?: string;
    failures: QueryCheckFailure[];
  }) {
    const { failures, ...props } = error;
    super(props);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, QueryCheckError);
    }
    this.name = "QueryCheckError";
    this.failures = failures;
  }
}

/**
 * A failure due to the timeout being exceeded, but the timeout
 * was set lower than the query's expected processing time.
 * This response is distinguished from a ServiceTimeoutException
 * in that a QueryTimeoutError shows Fauna behaving in an expected
 * manner.
 */
export class QueryTimeoutError extends ServiceError {
  /**
   * Statistics regarding the query.
   */
  readonly stats?: { [key: string]: number };

  constructor(error: {
    code: string;
    message: string;
    httpStatus: 440;
    summary?: string;
    // TODO stats not yet supported in API
    stats?: { [key: string]: number };
  }) {
    const { stats, ...props } = error;
    super(props);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, QueryTimeoutError);
    }
    this.name = "QueryTimeoutError";
    if (stats) {
      this.stats = stats;
    }
  }
}

/**
 * AuthenticationError indicates invalid credentials were
 * used.
 */
export class AuthenticationError extends ServiceError {
  constructor(error: {
    code: string;
    message: string;
    httpStatus: 401;
    summary?: string;
  }) {
    super(error);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthenticationError);
    }
    this.name = "AuthenticationError";
  }
}

/**
 * AuthorizationError indicates the credentials used do not have
 * permission to perform the requested action.
 */
export class AuthorizationError extends ServiceError {
  constructor(error: {
    code: string;
    message: string;
    httpStatus: 403;
    summary?: string;
  }) {
    super(error);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthorizationError);
    }
    this.name = "AuthorizationError";
  }
}

/**
 * ThrottlingError indicates some capacity limit was exceeded
 * and thus the request could not be served.
 */
export class ThrottlingError extends ServiceError {
  constructor(error: {
    code: string;
    message: string;
    httpStatus: 429;
    summary?: string;
  }) {
    super(error);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ThrottlingError);
    }
    this.name = "ThrottlingError";
  }
}

/**
 * ServiceInternalError indicates Fauna failed unexpectedly.
 */
export class ServiceInternalError extends ServiceError {
  constructor(error: {
    code: string;
    message: string;
    httpStatus: 500;
    summary?: string;
  }) {
    super(error);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ServiceInternalError);
    }
    this.name = "ServiceInternalError";
  }
}

/**
 * ServiceTimeoutError indicates Fauna was not available to servce
 * the request before the timeout was reached.
 */
export class ServiceTimeoutError extends ServiceError {
  constructor(error: {
    code: string;
    message: string;
    httpStatus: 503;
    summary?: string;
  }) {
    super(error);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ServiceTimeoutError);
    }
    this.name = "ServiceTimeoutError";
  }
}

/**
 * An error representing a failure internal to the client, itself.
 * This indicates Fauna was never called - the client failed internally
 * prior to sending the qreuest.
 */
export class ClientError extends Error {
  constructor(message: string, options: { cause: any }) {
    super(message, options);
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ClientError);
    }
    this.name = "ClientError";
  }
}

/**
 * An error representing a failure due to the network.
 * This indicates Fauna was never reached.
 */
export class NetworkError extends Error {
  constructor(message: string, options: { cause: any }) {
    super(message, options);
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NetworkError);
    }
    this.name = "NetworkError";
  }
}

/**
 * An error representing a HTTP failure - but one not directly
 * emitted by Fauna.
 */
export class ProtocolError extends Error {
  /**
   * The HTTP Status Code of the error.
   */
  readonly httpStatus: number;

  constructor(error: { message: string; httpStatus: number }) {
    super(error.message);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ProtocolError);
    }

    this.name = "ProtocolError";
    this.httpStatus = error.httpStatus;
  }
}

/**
 * QueryCheckFailure represents the cause of a pre-execution problem with the query.
 * For example, if a query has malformed syntax the error thrown by the API will
 * include a QueryCheckFailure indicating where this syntax error is.
 */
export interface QueryCheckFailure {
  /**
   * A predefined code indicating the type of QueryCheckFailure.
   * See the docs at {@link todo} for a list of codes.
   * Safe for programmatic use.
   */
  readonly code: string;
  /**
   * A short, human readable description of the QueryCheckFailure.
   * Not intended for programmatic use.
   */
  readonly message: string;
  /**
   * Further detail about the QueryCheckFailure. Intended to be displayed as an
   * in-line annotation of the error location.
   */
  readonly annotation?: string;
  /**
   * A source span indicating a segment of FQL. Indicates where the QueryCheckFailure occured.
   */
  readonly location?: Span;
}

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
 * All objects returned from Fauna are valid JSON objects.
 */
export type JSONObject = {
  [key: string]: JSONValue;
};

/**
 * All values returned from Fauna are valid JSON values.
 */
export type JSONValue =
  | null
  | string
  | number
  | boolean
  | JSONObject
  | Array<JSONValue>;
