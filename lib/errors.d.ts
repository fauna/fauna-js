import { QueryFailure } from "./wire-protocol";
/**
 * An error representing a query failure returned by Fauna.
 */
export declare class ServiceError extends Error {
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
    constructor(failure: QueryFailure, httpStatus: number);
}
/**
 * An error response that is the result of the query failing during execution.
 * QueryRuntimeError's occur when a bug in your query causes an invalid execution
 * to be requested.
 * The 'code' field will vary based on the specific error cause.
 */
export declare class QueryRuntimeError extends ServiceError {
    constructor(failure: QueryFailure, httpStatus: 400);
}
/**
 * An error due to a "compile-time" check of the query
 * failing.
 */
export declare class QueryCheckError extends ServiceError {
    constructor(failure: QueryFailure, httpStatus: 400);
}
/**
 * A failure due to the timeout being exceeded, but the timeout
 * was set lower than the query's expected processing time.
 * This response is distinguished from a ServiceTimeoutException
 * in that a QueryTimeoutError shows Fauna behaving in an expected
 * manner.
 */
export declare class QueryTimeoutError extends ServiceError {
    /**
     * Statistics regarding the query.
     */
    readonly stats?: {
        [key: string]: number;
    };
    constructor(failure: QueryFailure, httpStatus: 440);
}
/**
 * AuthenticationError indicates invalid credentials were
 * used.
 */
export declare class AuthenticationError extends ServiceError {
    constructor(failure: QueryFailure, httpStatus: 401);
}
/**
 * AuthorizationError indicates the credentials used do not have
 * permission to perform the requested action.
 */
export declare class AuthorizationError extends ServiceError {
    constructor(failure: QueryFailure, httpStatus: 403);
}
/**
 * ThrottlingError indicates some capacity limit was exceeded
 * and thus the request could not be served.
 */
export declare class ThrottlingError extends ServiceError {
    constructor(failure: QueryFailure, httpStatus: 429);
}
/**
 * ServiceInternalError indicates Fauna failed unexpectedly.
 */
export declare class ServiceInternalError extends ServiceError {
    constructor(failure: QueryFailure, httpStatus: 500);
}
/**
 * ServiceTimeoutError indicates Fauna was not available to servce
 * the request before the timeout was reached.
 */
export declare class ServiceTimeoutError extends ServiceError {
    constructor(failure: QueryFailure, httpStatus: 503);
}
/**
 * An error representing a failure internal to the client, itself.
 * This indicates Fauna was never called - the client failed internally
 * prior to sending the request.
 */
export declare class ClientError extends Error {
    constructor(message: string, options: {
        cause: any;
    });
}
/**
 * An error representing a failure due to the network.
 * This indicates Fauna was never reached.
 */
export declare class NetworkError extends Error {
    constructor(message: string, options: {
        cause: any;
    });
}
/**
 * An error representing a HTTP failure - but one not directly
 * emitted by Fauna.
 */
export declare class ProtocolError extends Error {
    /**
     * The HTTP Status Code of the error.
     */
    readonly httpStatus: number;
    constructor(error: {
        message: string;
        httpStatus: number;
    });
}
