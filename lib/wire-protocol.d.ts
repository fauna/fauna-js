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
    tags?: {
        [key: string]: string;
    };
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
    stats: {
        [key: string]: number;
    };
    /** The last transaction time of the query. An ISO-8601 date string. */
    txn_time: string;
    /** A readable summary of any warnings or logs emitted by the query. */
    summary?: string;
}
/**
 * An error representing a query failure returned by Fauna.
 */
export declare class ServiceError extends Error {
    /**
     * The HTTP Status Code of the error.
     * It is safe to write programmatic logic against the httpStatus. They are
     * part of the API contract.
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
    });
}
/**
 * An error representing a failure internal to the client, itself.
 * This indicates Fauna was never called - the client failed internally
 * prior to sending the qreuest.
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
 * All objects returned from Fauna are valid JSON objects.
 */
export declare type JSONObject = {
    [key: string]: JSONValue;
};
/**
 * All values returned from Fauna are valid JSON values.
 */
export declare type JSONValue = null | string | number | boolean | JSONObject | Array<JSONValue>;
