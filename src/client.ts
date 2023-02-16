import { ClientConfiguration, endpoints } from "./client-configuration";
import type { QueryBuilder } from "./query-builder";
import {
  AuthenticationError,
  AuthorizationError,
  ClientError,
  FaunaError,
  isQueryFailure,
  isQueryResponse,
  isQuerySuccess,
  NetworkError,
  ProtocolError,
  QueryCheckError,
  QueryRuntimeError,
  QueryTimeoutError,
  ServiceError,
  ServiceInternalError,
  ServiceTimeoutError,
  ThrottlingError,
  type QueryFailure,
  type QueryRequest,
  type QueryRequestHeaders,
  type QuerySuccess,
} from "./wire-protocol";
import { DefaultFetch, isFetchResponse } from "./http";

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
   *   {@link AuthenticationError}, {@link AuthorizationError}, {@link QueryCheckError}
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
    if ("query" in request) {
      return this.#query({ ...request, ...headers });
    }
    return this.#query(request.toQuery(headers));
  }

  #getError(e: any): ServiceError | ProtocolError | NetworkError | ClientError {
    // a response was received
    if (isFetchResponse(e)) {
      const body = e.body;
      const status = e.status;

      // the response is from Fauna
      if (isQueryFailure(body)) {
        return this.#getServiceError(body, status);
      }

      // the response is not from Fauna
      throw new ProtocolError(
        "Response body is an unknown format: " + JSON.stringify(body),
        status
      );
    }

    // unknown error
    return new ClientError(
      "A client level error occurred. Fauna was not called.",
      {
        cause: e,
      }
    );
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

  #getServiceError(failure: QueryFailure, httpStatus: number): ServiceError {
    switch (httpStatus) {
      case 400:
        if (
          httpStatus === 400 &&
          queryCheckFailureCodes.includes(failure.error.code)
        ) {
          return new QueryCheckError(failure, httpStatus);
        }

        return new QueryRuntimeError(failure, httpStatus);
      case 401:
        return new AuthenticationError(failure, httpStatus);
      case 403:
        return new AuthorizationError(failure, httpStatus);
      case 429:
        return new ThrottlingError(failure, httpStatus);
      case 440:
        return new QueryTimeoutError(failure, httpStatus);
      case 500:
        return new ServiceInternalError(failure, httpStatus);
      case 503:
        return new ServiceTimeoutError(failure, httpStatus);
      default:
        return new ServiceError(failure, httpStatus);
    }
  }

  async #query<T = any>(queryRequest: QueryRequest): Promise<QuerySuccess<T>> {
    const { query, arguments: args } = queryRequest;
    const headers: { [key: string]: string } = {};
    this.#setHeaders(queryRequest, headers);
    try {
      const url = `${this.clientConfiguration.endpoint.toString()}query/1`;
      const headers = {
        Authorization: `Bearer ${this.clientConfiguration.secret}`,
        "Content-Type": "application/json",
        // WIP - typecheck should be user configurable, but hard code for now
        "x-typecheck": "false",
        // WIP - presently core will default to tagged; hardcode to simple for now
        // until we get back to work on the JS driver.
        "x-format": "simple",
      };

      this.#setHeaders(this.clientConfiguration, headers);

      const fetchResponse = await this.clientConfiguration.fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          query,
          arguments: args,
        }),
        keepalive: true,
      });

      const queryResponse = fetchResponse.body;

      // Response came back as a valid error from Fauna
      if (isQueryFailure(queryResponse) || !isQueryResponse(queryResponse)) {
        // throw this.#getServiceError(queryResponse, response.status);
        throw this.#getError(fetchResponse);
      }

      // Response is not from Fauna
      if (!isQuerySuccess(queryResponse)) {
        throw new ProtocolError(
          "Unknown response format: " + JSON.stringify(fetchResponse),
          fetchResponse.status
        );
      }

      const txn_time = queryResponse.txn_time;
      const txnDate = new Date(txn_time);
      if (
        (this.#lastTxn === undefined && txn_time !== undefined) ||
        (txn_time !== undefined &&
          this.#lastTxn !== undefined &&
          this.#lastTxn < txnDate)
      ) {
        this.#lastTxn = txnDate;
      }

      return queryResponse as QuerySuccess<T>;
    } catch (e: any) {
      if (e instanceof FaunaError) {
        throw e;
      }
      throw this.#getError(e);
    }
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
