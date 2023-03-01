import { TaggedTypeEncoded } from "./tagged-type";
/**
 * A piece of an interpolated query that represents an actual value. Arguments
 * are passed to fauna using ValuFragments so that query string injection is not
 * possible.
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
export declare type ValueFragment = {
    value: TaggedTypeEncoded;
};
/**
 * A piece of an interpolated query. Queries can be safely composed together
 * without concern of query string injection.
 * @remarks A FQLFragment is created when calling the {@link fql} tagged
 * template function and can be passed as an argument to other QueryBuilders.
 * @example
 * ```typescript
 *  const num = 17;
 *  const query1 = fql`${num} + 3)`;
 *  const query2 = fql`5 + ${query1})`;
 *  // produces
 *  { fql: ["5 + ", { fql: [{ value: { "@int": "17" } }, " + 3"] }] }
 * ```
 */
export declare type FQLFragment = {
    fql: (string | QueryInterpolation)[];
};
/**
 * A piece of an interpolated query. Queries can be safely composed together
 * without concern of query string injection.
 * @see {@link ValueFragment} and {@link FQLFragment} for additional
 * information
 */
export declare type QueryInterpolation = FQLFragment | ValueFragment;
/**
 * A request to make to Fauna.
 */
export interface QueryRequest extends QueryRequestHeaders {
    /** The query */
    query: string | QueryInterpolation;
    /** Optional arguments. Variables in the query will be initialized to the
     * value associated with an argument key.
     */
    arguments?: JSONObject;
}
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
/** tagged declares that type information is transmitted and received by the driver. "simple" indicates it is not. */
export declare type ValueFormat = "simple" | "tagged";
export declare type QueryStats = {
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
export declare type QueryInfo = {
    /** The last transaction timestamp of the query. A Unix epoch in microseconds. */
    txn_ts: number;
    /** A readable summary of any warnings or logs emitted by the query. */
    summary?: string;
    /** The value of the x-query-tags header, if it was provided. */
    query_tags: Record<string, string>;
    /** Stats on query performance and cost */
    stats: QueryStats;
};
export declare type QuerySuccess<T> = QueryInfo & {
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
export declare type QueryFailure = QueryInfo & {
    /**
     * The result of the query resulting in
     */
    error: {
        /** A predefined code which indicates the type of error. See XXX for a list of error codes. */
        code: string;
        /** description: A short, human readable description of the error */
        message: string;
    };
};
export declare type QueryResponse<T> = QuerySuccess<T> | QueryFailure;
export declare const isQuerySuccess: (res: any) => res is QuerySuccess<any>;
export declare const isQueryFailure: (res: any) => res is QueryFailure;
export declare const isQueryResponse: (res: any) => res is QueryResponse<any>;
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
export declare type JSONObject = {
    [key: string]: JSONValue;
};
/**
 * All values returned from Fauna are valid JSON values.
 */
export declare type JSONValue = null | string | number | bigint | boolean | JSONObject | Array<JSONValue>;
