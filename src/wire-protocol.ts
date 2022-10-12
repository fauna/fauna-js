/**
 * A request to make to Fauna.
 */
export interface QueryRequest {
  /** The query. */
  query: string;
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
  stats: any;
  /** The last transaction time of the query. An ISO-8601 date string. */
  txn_time: string;
}

/**
 * An error representing a query failure returned by Fauna.
 */
export class QueryError extends Error {
  /**
   * The HTTP Status Code of the error.
   * A 400 \>= statusCode \<= 499 indicate a client-side problem with the request.
   * A statusCode \>= 500 indicate a server side error.
   */
  readonly statusCode: number;
  /**
   * A code for the error. Codes indicate the cause of the error.
   * It is safe to write programmatic logic against the code. They are
   * part of the API contract.
   */
  readonly code?: string;
  /**
   * An array of {@link QueryFailure} conveying the root cause of an _invalid query_.
   * QueryFailure are detected _before runtime_ - when your query is analyzed for correctness
   * prior to execution.
   * Present only for client-side problems caused by submitting malformed queries.
   * See {@link TODO} for a list of statsuCode and code associated with failures.
   * @example
   * ### This query is invalid as semicolons are not valid syntax.
   * ```
   * "taco".length;
   * ```
   */
  readonly failures?: Array<QueryFailure>;
  /**
   * The transaction time of the failed query.
   */
  readonly txn_time?: string;
  /**
   * Further statistics regarding the query.
   */
  readonly stats?: any;
  /**
   * An array of {@link Span} conveying the root cause of a _runtime_ problem with a query.
   * Present only for client-side problems caused by submitting queries that encounter
   * runtime problems.
   * See {@link TODO} for a list of statusCodes and codes associated with failures.
   * @example
   * ### A runtime problem is encountered by this query as "bad" is not an int.
   * ```
   * User.all.take("bad")
   * ```
   */
  readonly trace?: Array<Span>;

  constructor(error: {
    code?: string;
    message?: string;
    statusCode: number;
    failures?: Array<QueryFailure>;
    txn_time?: string;
    stats?: any;
    trace?: Array<Span>;
  }) {
    super(error.message);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, QueryError);
    }

    this.name = "QueryError";
    if (error.code) {
      this.code = error.code;
    }
    this.statusCode = error.statusCode;
    if (error.failures) {
      this.failures = error.failures;
    }
    if (error.txn_time) {
      this.txn_time = error.txn_time;
    }
    if (error.stats) {
      this.stats = error.stats;
    }
    if (error.trace) {
      this.trace = error.trace;
    }
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
 * QueryFailure represents the cause of a pre-execution problem with the query.
 * For example, if a query has malformed syntax the error thrown by the API will
 * include a QueryFailure indicating where this syntax error is.
 */
export interface QueryFailure {
  /**
   * A predefined code indicating the type of QueryFailure.
   * See the docs at {@link todo} for a list of codes.
   * Safe for programmatic use.
   */
  readonly code: string;
  /**
   * A short, human readable description of the QueryFailure.
   * Not intended for programmatic use.
   */
  readonly message: string;
  /**
   * Further detail about the QueryFailure. Intended to be displayed as an
   * in-line annotation of the error location.
   */
  readonly annotation: string;
  /**
   * A source span indicating a segment of FQL. Indicates where the QueryFailure occured.
   */
  readonly location: Span;
}

/**
 * A source span indicating a segemnt of FQL.
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
