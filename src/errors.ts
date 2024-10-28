import type {
  ConstraintFailure,
  QueryFailure,
  QueryInfo,
  QueryStats,
  QueryValue,
} from "./wire-protocol";

/**
 * A common error base class for all other errors.
 */
export abstract class FaunaError extends Error {
  constructor(...args: any[]) {
    super(...args);
  }
}

/**
 * An error representing a query failure returned by Fauna.
 */
export class ServiceError extends FaunaError {
  /**
   * The HTTP Status Code of the error.
   */
  readonly httpStatus?: number;
  /**
   * A code for the error. Codes indicate the cause of the error.
   * It is safe to write programmatic logic against the code. They are
   * part of the API contract.
   */
  readonly code: string;
  /**
   * Details about the query sent along with the response
   */
  readonly queryInfo?: QueryInfo;
  /**
   * A machine readable description of any constraint failures encountered by the query.
   * Present only if this query encountered constraint failures.
   */
  readonly constraint_failures?: Array<ConstraintFailure>;

  constructor(failure: QueryFailure, httpStatus?: number) {
    super(failure.error.message);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ServiceError);
    }

    this.name = "ServiceError";
    this.code = failure.error.code;
    this.httpStatus = httpStatus;

    const info: QueryInfo = {
      txn_ts: failure.txn_ts,
      summary: failure.summary,
      query_tags: failure.query_tags,
      stats: failure.stats,
    };
    this.queryInfo = info;

    this.constraint_failures = failure.error.constraint_failures;
  }
}

/**
 * An error response that is the result of the query failing during execution.
 * QueryRuntimeError's occur when a bug in your query causes an invalid execution
 * to be requested.
 * The 'code' field will vary based on the specific error cause.
 */
export class QueryRuntimeError extends ServiceError {
  constructor(failure: QueryFailure, httpStatus?: number) {
    super(failure, httpStatus);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, QueryRuntimeError);
    }
    this.name = "QueryRuntimeError";
    // TODO trace, txn_ts, and stats not yet returned for QueryRuntimeError
    // flip to check for those rather than a specific code.
  }
}

/**
 * An error due to a "compile-time" check of the query
 * failing.
 */
export class QueryCheckError extends ServiceError {
  constructor(failure: QueryFailure, httpStatus?: number) {
    super(failure, httpStatus);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, QueryCheckError);
    }
    this.name = "QueryCheckError";
  }
}

/**
 * An error due to an invalid request to Fauna. Either the request body was not
 * valid JSON or did not conform to the API specification
 */
export class InvalidRequestError extends ServiceError {
  constructor(failure: QueryFailure, httpStatus?: number) {
    super(failure, httpStatus);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidRequestError);
    }
    this.name = "InvalidRequestError";
  }
}

/**
 * A runtime error due to failing schema constraints.
 */
export class ConstraintFailureError extends ServiceError {
  /**
   * The list of constraints that failed.
   */
  readonly constraint_failures: Array<ConstraintFailure>;

  constructor(
    failure: QueryFailure & {
      error: { constraint_failures: Array<ConstraintFailure> };
    },
    httpStatus?: number,
  ) {
    super(failure, httpStatus);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, QueryCheckError);
    }
    this.name = "ConstraintFailureError";
    this.constraint_failures = failure.error.constraint_failures;
  }
}

/**
 * An error due to calling the FQL `abort` function.
 */
export class AbortError extends ServiceError {
  /**
   * The user provided value passed to the originating `abort()` call.
   * Present only when the query encountered an `abort()` call, which is denoted
   * by the error code `"abort"`
   */
  readonly abort: QueryValue;

  constructor(
    failure: QueryFailure & { error: { abort: QueryValue } },
    httpStatus?: number,
  ) {
    super(failure, httpStatus);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, QueryCheckError);
    }
    this.name = "AbortError";
    this.abort = failure.error.abort;
  }
}

/**
 * AuthenticationError indicates invalid credentials were
 * used.
 */
export class AuthenticationError extends ServiceError {
  constructor(failure: QueryFailure, httpStatus?: number) {
    super(failure, httpStatus);
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
  constructor(failure: QueryFailure, httpStatus?: number) {
    super(failure, httpStatus);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthorizationError);
    }
    this.name = "AuthorizationError";
  }
}

/**
 * An error due to a contended transaction.
 */
export class ContendedTransactionError extends ServiceError {
  constructor(failure: QueryFailure, httpStatus?: number) {
    super(failure, httpStatus);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidRequestError);
    }
    this.name = "ContendedTransactionError";
  }
}

/**
 * ThrottlingError indicates some capacity limit was exceeded
 * and thus the request could not be served.
 */
export class ThrottlingError extends ServiceError {
  constructor(failure: QueryFailure, httpStatus?: number) {
    super(failure, httpStatus);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ThrottlingError);
    }
    this.name = "ThrottlingError";
  }
}

/**
 * A failure due to the query timeout being exceeded.
 *
 * This error can have one of two sources:
 *     1. Fauna is behaving expectedly, but the query timeout provided was too
 *        aggressive and lower than the query's expected processing time.
 *     2. Fauna was not available to service the request before the timeout was
 *        reached.
 *
 * In either case, consider increasing the `query_timeout_ms` configuration for
 * your client.
 */
export class QueryTimeoutError extends ServiceError {
  /**
   * Statistics regarding the query.
   *
   * TODO: Deprecate this `stats` field. All `ServiceError`s already provide
   * access to stats through `queryInfo.stats`
   */
  readonly stats?: QueryStats;

  constructor(failure: QueryFailure, httpStatus?: number) {
    super(failure, httpStatus);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, QueryTimeoutError);
    }
    this.name = "QueryTimeoutError";
    this.stats = failure.stats;
  }
}

/**
 * ServiceInternalError indicates Fauna failed unexpectedly.
 */
export class ServiceInternalError extends ServiceError {
  constructor(failure: QueryFailure, httpStatus?: number) {
    super(failure, httpStatus);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ServiceInternalError);
    }
    this.name = "ServiceInternalError";
  }
}

/**
 * An error representing a failure internal to the client, itself.
 * This indicates Fauna was never called - the client failed internally
 * prior to sending the request.
 */
export class ClientError extends FaunaError {
  constructor(message: string, options?: { cause: any }) {
    super(message, options);
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ClientError);
    }
    this.name = "ClientError";
  }
}

/**
 * An error thrown if you try to call the client after it has been closed.
 */
export class ClientClosedError extends FaunaError {
  constructor(message: string, options?: { cause: any }) {
    super(message, options);
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ClientClosedError);
    }
    this.name = "ClientClosedError";
  }
}

/**
 * An error representing a failure due to the network.
 * This indicates Fauna was never reached.
 */
export class NetworkError extends FaunaError {
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
export class ProtocolError extends FaunaError {
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

export const getServiceError = (
  failure: QueryFailure,
  httpStatus?: number,
): ServiceError => {
  const failureCode = failure.error.code;

  switch (failureCode) {
    case "invalid_query":
      return new QueryCheckError(failure, httpStatus);

    case "invalid_request":
      return new InvalidRequestError(failure, httpStatus);

    case "abort":
      if (failure.error.abort !== undefined) {
        return new AbortError(
          failure as QueryFailure & { error: { abort: QueryValue } },
          httpStatus,
        );
      }
      break;

    case "constraint_failure":
      if (failure.error.constraint_failures !== undefined) {
        return new ConstraintFailureError(
          failure as QueryFailure & {
            error: { constraint_failures: Array<ConstraintFailure> };
          },
          httpStatus,
        );
      }
      break;

    case "unauthorized":
      return new AuthenticationError(failure, httpStatus);

    case "forbidden":
      return new AuthorizationError(failure, httpStatus);

    case "contended_transaction":
      return new ContendedTransactionError(failure, httpStatus);

    case "limit_exceeded":
      return new ThrottlingError(failure, httpStatus);

    case "time_out":
      return new QueryTimeoutError(failure, httpStatus);

    case "internal_error":
      return new ServiceInternalError(failure, httpStatus);
  }

  return new QueryRuntimeError(failure, httpStatus);
};
