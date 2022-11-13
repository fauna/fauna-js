/// <reference types="node" />

import { AxiosInstance } from "axios";

/**
 * AuthenticationError indicates invalid credentials were
 * used.
 */
export declare class AuthenticationError extends ServiceError {
  constructor(error: {
    code: string;
    message: string;
    httpStatus: 401;
    summary?: string;
  });
}

/**
 * AuthorizationError indicates the credentials used do not have
 * permission to perform the requested action.
 */
export declare class AuthorizationError extends ServiceError {
  constructor(error: {
    code: string;
    message: string;
    httpStatus: 403;
    summary?: string;
  });
}

/**
 * Client for calling Fauna.
 */
export declare class Client {
  #private;
  /** The {@link ClientConfiguration} */
  readonly clientConfiguration: ClientConfiguration;
  /** The underlying {@link AxiosInstance} client. */
  readonly client: AxiosInstance;
  /**
   * Constructs a new {@link Client}.
   * @param clientConfiguration - the {@link ClientConfiguration} to apply.
   * @example
   * ```typescript
   *  const myClient = new Client(
   *   {
   *     endpoint: endpoints.cloud,
   *     max_conns: 10,
   *     secret: "foo",
   *     timeout_ms: 60_000,
   *   }
   * );
   * ```
   */
  constructor(clientConfiguration?: Partial<ClientConfiguration>);
  /**
   * Queries Fauna.
   * @param request - a {@link QueryRequest} or {@link QueryBuilder} to build a request with.
   *  Note, you can embed header fields in this object; if you do that there's no need to
   *  pass the headers parameter.
   * @param headers - optional {@link QueryRequestHeaders} to apply on top of the request input.
   *   Values in this headers parameter take precedence over the same values in the request
   *   parameter. This field is primarily intended to be used when you pass a QueryBuilder as
   *   the parameter.
   * @returns Promise&lt;{@link QueryResponse}&gt;.
   * @throws {@link ServiceError} Fauna emitted an error. The ServiceError will be
   *   one of ServiceError's child classes if the error can be further categorized,
   *   or a concrete ServiceError if it cannot. ServiceError child types are
   *   {@link AuthenticaionError}, {@link AuthorizationError}, {@link QueryCheckError}
   *   {@link QueryRuntimeError}, {@link QueryTimeoutError}, {@link ServiceInternalError}
   *   {@link ServiceTimeoutError}, {@link ThrottlingError}.
   *   You can use either the type, or the underlying httpStatus + code to determine
   *   the root cause.
   * @throws {@link ProtocolError} the client a HTTP error not sent by Fauna.
   * @throws {@link NetworkError} the client encountered a network issue
   * connecting to Fauna.
   * @throws A {@link ClientError} the client fails to submit the request
   * due to an internal error.
   */
  query<T = any>(
    request: QueryRequest | QueryBuilder,
    headers?: QueryRequestHeaders
  ): Promise<QueryResponse<T>>;
}

/**
 * Configuration for a client.
 */
export declare interface ClientConfiguration {
  /**
   * The {@link URL} of Fauna to call. See {@link endpoints} for some default options.
   */
  endpoint: URL;
  /**
   * The maximum number of connections to a make to Fauna.
   */
  max_conns: number;
  /**
   * A secret for your Fauna DB, used to authorize your queries.
   * @see https://docs.fauna.com/fauna/current/security/keys
   */
  secret: string;
  /**
   * The timeout of each query, in milliseconds. This controls the maximum amount of
   * time Fauna will execute your query before marking it failed.
   */
  timeout_ms: number;
  /**
   * If true, unconditionally run the query as strictly serialized.
   * This affects read-only transactions. Transactions which write
   * will always be strictly serialized.
   */
  linearized?: boolean;
  /**
   * The max number of times to retry the query if contention is encountered.
   */
  max_contention_retries?: number;
  /**
   * Tags provided back via logging and telemetry.
   */
  tags?: {
    [key: string]: string;
  };
  /**
   * A traceparent provided back via logging and telemetry.
   * Must match format: https://www.w3.org/TR/trace-context/#traceparent-header
   */
  traceparent?: string;
}

/**
 * An error representing a failure internal to the client, itself.
 * This indicates Fauna was never called - the client failed internally
 * prior to sending the qreuest.
 */
export declare class ClientError extends Error {
  constructor(
    message: string,
    options: {
      cause: any;
    }
  );
}

/**
 * An extensible interface for a set of Fauna endpoints.
 * @remarks Leverage the `[key: string]: URL;` field to extend to other endpoints.
 */
export declare interface Endpoints {
  /** Fauna's cloud endpoint. */
  cloud: URL;
  /** Fauna's preview endpoint for testing new features - requires beta access. */
  preview: URL;
  /**
   * An endpoint for interacting with local instance of Fauna (e.g. one running in a local docker container).
   */
  local: URL;
  /**
   * An alias for local.
   */
  localhost: URL;
  /**
   * Any other endpoint you want your client to support. For example, if you run all requests through a proxy
   * configure it here. Most clients will not need to leverage this ability.
   */
  [key: string]: URL;
}

/**
 * A extensible set of endpoints for calling Fauna.
 * @remarks Most clients will will not need to extend this set.
 * @example
 * ## To Extend
 * ```typescript
 *   // add to the endpoints constant
 *   endpoints.myProxyEndpoint = new URL("https://my.proxy.url");
 * ```
 */
export declare const endpoints: Endpoints;

/**
 * Creates a new QueryBuilder. Accepts template literal inputs.
 * @param queryFragments - a {@link TemplateStringsArray} that constitute
 *   the strings that are the basis of the query.
 * @param queryArgs - an Array\<JSONValue | QueryBuilder\> that
 *   constitute the arguments to inject between the queryFragments.
 * @throws Error - if you call this method directly (not using template
 *   literals) and pass invalid construction parameters
 * @example
 * ```typescript
 *  const str = "baz";
 *  const num = 17;
 *  const innerQueryBuilder = fql`Math.add(${num}, 3)`;
 *  const queryRequestBuilder = fql`${str}.length == ${innerQueryBuilder}`;
 * ```
 */
export declare function fql(
  queryFragments: TemplateStringsArray,
  ...queryArgs: (JSONValue | QueryBuilder)[]
): QueryBuilder;

/**
 * All objects returned from Fauna are valid JSON objects.
 */
export declare type JSONObject = {
  [key: string]: JSONValue;
};

/**
 * All values returned from Fauna are valid JSON values.
 */
export declare type JSONValue =
  | null
  | string
  | number
  | boolean
  | JSONObject
  | Array<JSONValue>;

/**
 * An error representing a failure due to the network.
 * This indicates Fauna was never reached.
 */
export declare class NetworkError extends Error {
  constructor(
    message: string,
    options: {
      cause: any;
    }
  );
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
  constructor(error: { message: string; httpStatus: number });
}

export declare interface QueryBuilder {
  toQuery: (
    headers?: QueryRequestHeaders,
    intialArgNumber?: number
  ) => QueryRequest;
}

/**
 * An error due to a "compile-time" check of the query
 * failing.
 */
export declare class QueryCheckError extends ServiceError {
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
  });
}

/**
 * QueryCheckFailure represents the cause of a pre-execution problem with the query.
 * For example, if a query has malformed syntax the error thrown by the API will
 * include a QueryCheckFailure indicating where this syntax error is.
 */
export declare interface QueryCheckFailure {
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
 * A request to make to Fauna.
 */
export declare interface QueryRequest extends QueryRequestHeaders {
  /** The query. */
  query: string;
  /** Optional arguments if your query is interpolated. */
  arguments?: JSONObject;
}

export declare interface QueryRequestHeaders {
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
export declare interface QueryResponse<T> {
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
}

/**
 * An error response that is the result of the query failing during execution.
 * QueryRuntimeError's occur when a bug in your query causes an invalid execution
 * to be requested.
 * The 'code' field will vary based on the specific error cause.
 */
export declare class QueryRuntimeError extends ServiceError {
  constructor(error: {
    code: string;
    message: string;
    httpStatus: 400;
    summary?: string;
  });
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
  constructor(error: {
    code: string;
    message: string;
    httpStatus: 440;
    summary?: string;
    stats?: {
      [key: string]: number;
    };
  });
}

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
  constructor(error: {
    code: string;
    message: string;
    httpStatus: number;
    summary?: string;
  });
}

/**
 * ServiceInternalError indicates Fauna failed unexpectedly.
 */
export declare class ServiceInternalError extends ServiceError {
  constructor(error: {
    code: string;
    message: string;
    httpStatus: 500;
    summary?: string;
  });
}

/**
 * ServiceTimeoutError indicates Fauna was not available to servce
 * the request before the timeout was reached.
 */
export declare class ServiceTimeoutError extends ServiceError {
  constructor(error: {
    code: string;
    message: string;
    httpStatus: 503;
    summary?: string;
  });
}

/**
 * A source span indicating a segment of FQL.
 */
export declare interface Span {
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
 * ThrottlingError indicates some capacity limit was exceeded
 * and thus the request could not be served.
 */
export declare class ThrottlingError extends ServiceError {
  constructor(error: {
    code: string;
    message: string;
    httpStatus: 429;
    summary?: string;
  });
}

export {};
