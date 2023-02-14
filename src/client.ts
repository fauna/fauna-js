import { ClientConfiguration, endpoints } from "./client-configuration";
import { DefaultFetch } from "./fetch";
import type { QueryBuilder } from "./query-builder";
import {
  AuthenticationError,
  AuthorizationError,
  ClientError,
  NetworkError,
  ProtocolError,
  QueryCheckError,
  QueryRuntimeError,
  QueryTimeoutError,
  ServiceError,
  ServiceInternalError,
  ServiceTimeoutError,
  ThrottlingError,
  type QueryRequest,
  type QueryRequestHeaders,
  type QuerySuccess,
  type QueryFailure,
  queryResponseIsFailure,
} from "./wire-protocol";

const defaultClientConfiguration = {
  max_conns: 10,
  endpoint: endpoints.cloud,
  timeout_ms: 60_000,
  fetch: DefaultFetch,
};

/**
 * Client for calling Fauna.
 */
export class Client {
  /** The {@link ClientConfiguration} */
  readonly clientConfiguration: ClientConfiguration;
  /** last_txn this client has seen */
  #lastTxn?: Date;

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
  constructor(clientConfiguration?: Partial<ClientConfiguration>) {
    this.clientConfiguration = {
      ...defaultClientConfiguration,
      ...clientConfiguration,
      secret: this.#getSecret(clientConfiguration),
    };
  }

  #getSecret(partialClientConfig?: Partial<ClientConfiguration>): string {
    let fallback = undefined;
    if (typeof process === "object") {
      fallback = process.env["FAUNA_SECRET"];
    }
    const maybeSecret = partialClientConfig?.secret || fallback;
    if (maybeSecret === undefined) {
      throw new Error(
        "You must provide a secret to the driver. Set it \
in an environmental variable named FAUNA_SECRET or pass it to the Client\
 constructor."
      );
    }
    return maybeSecret;
  }

  /**
   * Queries Fauna.
   * @param request - a {@link QueryRequest} or {@link QueryBuilder} to build a request with.
   *  Note, you can embed header fields in this object; if you do that there's no need to
   *  pass the headers parameter.
   * @param headers - optional {@link QueryRequestHeaders} to apply on top of the request input.
   *   Values in this headers parameter take precedence over the same values in the request
   *   parameter. This field is primarily intended to be used when you pass a QueryBuilder as
   *   the parameter.
   * @returns Promise&lt;{@link QuerySuccess}&gt;.
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
  async query<T = any>(
    request: QueryRequest | QueryBuilder,
    headers?: QueryRequestHeaders
  ): Promise<QuerySuccess<T>> {
    // TODO: can we refactor to use a type predicate here instead?
    if ("query" in request) {
      return this.#query({ ...request, ...headers });
    }
    return this.#query(request.toQuery(headers));
  }

  async #query<T = any>(queryRequest: QueryRequest): Promise<QuerySuccess<T>> {
    const { query, arguments: args } = queryRequest;
    try {
      const url = `${this.clientConfiguration.endpoint.toString()}query/1`;
      const headers = {
        Authorization: `Bearer ${this.clientConfiguration.secret}`,
        "Content-Type": "application/json",
      };

      this.#setHeaders(this.clientConfiguration, headers);

      const response = await this.clientConfiguration.fetch<T>(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          query,
          arguments: args,
          // WIP - typecheck should be user configurable, but hard code for now
          typecheck: false,
          // WIP - presently core will default to tagged; hardcode to simple for now
          // until we get back to work on the JS driver.
          format: "simple",
        }),
        keepalive: true,
      });

      const queryResult = response.body;

      if (queryResponseIsFailure(queryResult)) {
        throw this.#getServiceError(response.status, queryResult);
      }

      const txn_time = queryResult.txn_time;
      const txnDate = new Date(txn_time);
      if (
        (this.#lastTxn === undefined && txn_time !== undefined) ||
        (txn_time !== undefined &&
          this.#lastTxn !== undefined &&
          this.#lastTxn < txnDate)
      ) {
        this.#lastTxn = txnDate;
      }

      return queryResult;
    } catch (e: any) {
      if (e instanceof ServiceError) {
        throw e;
      }
      throw this.#getError(e);
    }
  }

  #getError(e: any): ServiceError | ProtocolError | NetworkError | ClientError {
    // see: https://axios-http.com/docs/handling_errors
    if (e.response) {
      // we got an error from the fauna service
      if (e.response.data?.error) {
        const error = e.response.data.error;
        // WIP - summary is moving to a top-level field in the service
        if (
          error.summary === undefined &&
          e.response.data.summary !== undefined
        ) {
          error.summary = e.response.data.summary;
        }
        return this.#getServiceError(error, e.response.status);
      }
      // we got a different error from the protocol layer
      return new ProtocolError({
        message: e.message,
        httpStatus: e.response.status,
      });
    }
    // we're in the browser dealing with an XMLHttpRequest that was never sent
    // OR we're in node dealing with an HTTPClient.Request that never connected
    // OR node or axios hit a network connection problem at a lower level,
    // OR axios threw a network error
    // see: https://nodejs.org/api/errors.html#nodejs-error-codes
    if (
      e.request?.status === 0 ||
      e.request?.socket?.connecting ||
      nodeOrAxiosNetworkErrorCodes.includes(e.code) ||
      "Network Error" === e.message
    ) {
      return new NetworkError("The network connection encountered a problem.", {
        cause: e,
      });
    }
    // unknown error
    return new ClientError(
      "A client level error occurred. Fauna was not called.",
      {
        cause: e,
      }
    );
  }

  #getServiceError(
    // error: {
    //   code: string;
    //   message: string;
    //   summary?: string;
    //   stats?: { [key: string]: number };
    //   trace?: Array<Span>;
    //   txn_time?: string;
    // },
    httpStatus: number,
    failure: QueryFailure
  ): ServiceError {
    if (httpStatus === 401) {
      return new AuthenticationError(httpStatus, failure);
    }
    if (httpStatus === 403) {
      return new AuthorizationError(httpStatus, failure);
    }
    if (httpStatus === 500) {
      return new ServiceInternalError(httpStatus, failure);
    }
    if (httpStatus === 503) {
      return new ServiceTimeoutError(httpStatus, failure);
    }
    if (httpStatus === 429) {
      return new ThrottlingError(httpStatus, failure);
    }
    if (httpStatus === 440) {
      // TODO stats not yet returned. Include it when it is.
      return new QueryTimeoutError(httpStatus, failure);
    }
    // TODO using a list of codes to categorize as QueryCheckError
    // vs QueryRutimeError is brittle and coupled to the service
    // implementation.
    // We need a field sent across the wire that categorizes 400s as either
    // runtime failures or check failures so we are not coupled to the list
    // of codes emitted by the service.
    if (
      httpStatus === 400 &&
      queryCheckFailureCodes.includes(failure.error.code)
    ) {
      return new QueryCheckError(httpStatus, failure);
    } else if (httpStatus === 400) {
      return new QueryRuntimeError(httpStatus, failure);
    }
    return new ServiceError(httpStatus, failure);
  }

  #setHeaders(fromObject: QueryRequestHeaders, headerObject: any): void {
    for (const entry of Object.entries(fromObject)) {
      if (
        [
          "last_txn",
          "timeout_ms",
          "linearized",
          "max_contention_retries",
          "traceparent",
          "tags",
        ].includes(entry[0])
      ) {
        let headerValue: string;
        let headerKey = `x-${entry[0].replaceAll("_", "-")}`;
        if ("tags" === entry[0]) {
          headerKey = "x-fauna-tags";
          headerValue = Object.entries(entry[1])
            .map((tag) => tag.join("="))
            .join(",");
        } else {
          if (typeof entry[1] === "string") {
            headerValue = entry[1];
          } else {
            headerValue = String(entry[1]);
          }
        }
        if ("traceparent" === entry[0]) {
          headerKey = entry[0];
        }
        headerObject[headerKey] = headerValue;
      }
    }
    if (
      headerObject["x-last-txn"] === undefined &&
      this.#lastTxn !== undefined
    ) {
      headerObject["x-last-txn"] = this.#lastTxn.toISOString();
    }
  }
}

// Private types and constants for internal logic.

const queryCheckFailureCodes = [
  "invalid_function_definition",
  "invalid_identifier",
  "invalid_query",
  "invalid_syntax",
  "invalid_type",
];

const nodeOrAxiosNetworkErrorCodes = [
  "ECONNABORTED",
  "ECONNREFUSED",
  "ECONNRESET",
  "ERR_NETWORK",
  "ETIMEDOUT",
  // axios does not yet support http2, but preparing
  // in case we move to a library that does or axios
  // adds in support.
  "ERR_HTTP_REQUEST_TIMEOUT",
  "ERR_HTTP2_GOAWAY_SESSION",
  "ERR_HTTP2_INVALID_SESSION",
  "ERR_HTTP2_INVALID_STREAM",
  "ERR_HTTP2_OUT_OF_STREAMS",
  "ERR_HTTP2_SESSION_ERROR",
  "ERR_HTTP2_STREAM_CANCEL",
  "ERR_HTTP2_STREAM_ERROR",
];
