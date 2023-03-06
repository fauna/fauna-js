import { ClientConfiguration, endpoints } from "./client-configuration";
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
} from "./errors";
import type { QueryBuilder } from "./query-builder";
import {
  isQueryFailure,
  isQuerySuccess,
  type QueryFailure,
  type QueryRequest,
  type QueryRequestHeaders,
  type QuerySuccess,
} from "./wire-protocol";
import {
  getDefaultHTTPClient,
  HTTPResponse,
  isHTTPResponse,
  type HTTPClient,
} from "./http-client";
import { TaggedTypeFormat } from "./tagged-type";

const defaultClientConfiguration: Pick<
  ClientConfiguration,
  "endpoint" | "max_conns"
> = {
  endpoint: endpoints.cloud,
  max_conns: 10,
};

/**
 * Client for calling Fauna.
 */
export class Client {
  /** The {@link ClientConfiguration} */
  readonly #clientConfiguration: ClientConfiguration;
  /** The underlying {@link HTTPClient} client. */
  readonly #httpClient: HTTPClient;
  /** The last transaction timestamp this client has seen */
  #lastTxnTs?: number;
  /** url of Fauna */
  #url: string;

  /**
   * Constructs a new {@link Client}.
   * @param clientConfiguration - the {@link ClientConfiguration} to apply. Defaults to recommended ClientConfiguraiton.
   * @param httpClient - The underlying {@link HTTPClient} that will execute the actual HTTP calls. Defaults to recommended HTTPClient.
   * @example
   * ```typescript
   *  const myClient = new Client(
   *   {
   *     endpoint: endpoints.cloud,
   *     max_conns: 10,
   *     secret: "foo",
   *     query_timeout_ms: 60_000,
   *   }
   * );
   * ```
   */
  constructor(
    clientConfiguration?: Partial<ClientConfiguration>,
    httpClient?: HTTPClient
  ) {
    this.#clientConfiguration = {
      ...defaultClientConfiguration,
      ...clientConfiguration,
      secret: this.#getSecret(clientConfiguration),
    };
    this.#url = `${this.clientConfiguration.endpoint.toString()}query/1`;
    if (!httpClient) {
      this.#httpClient = getDefaultHTTPClient();
    } else {
      this.#httpClient = httpClient;
    }
  }

  /**
   * @returns the last transaction time seen by this client, or undefined if this client has not seen a transaction time.
   */
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore it's okay that #lastTxnTs could be undefined on get, but we want
  //   to enforce that the user never intentionally set it to undefined.
  get lastTxnTs(): number | undefined {
    return this.#lastTxnTs;
  }
  /**
   * Sets the last transaction time of this client.
   * @param ts - the last transaction timestamp to set, as microseconds since
   *   the epoch. If `ts` is less than the existing `#lastTxnTs` value, then no
   *   change is made.
   */
  set lastTxnTs(ts: number) {
    this.#lastTxnTs = this.#lastTxnTs ? Math.max(ts, this.#lastTxnTs) : ts;
  }

  /**
   * Return the {@link ClientConfiguration} of this client, save for the secret.
   */
  get clientConfiguration(): Omit<ClientConfiguration, "secret"> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { secret, ...rest } = this.#clientConfiguration;
    return rest;
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
    if ("query" in request) {
      return this.#query({ ...request, ...headers });
    }
    return this.#query(request.toQuery(headers));
  }

  #getError(e: any): ClientError | NetworkError | ProtocolError | ServiceError {
    // the error was already handled by the driver
    if (
      e instanceof ClientError ||
      e instanceof NetworkError ||
      e instanceof ProtocolError ||
      e instanceof ServiceError
    ) {
      return e;
    }

    // the HTTP request succeeded, but there was an error
    if (isHTTPResponse(e)) {
      // we got an error from the fauna service
      if (isQueryFailure(e.body)) {
        const failure = e.body;
        const status = e.status;
        return this.#getServiceError(failure, status);
      }

      // we got a different error from the protocol layer
      return new ProtocolError({
        message: `Response is in an unkown format: ${e.body}`,
        httpStatus: e.status,
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
    try {
      const headers = {
        Authorization: `Bearer ${this.#clientConfiguration.secret}`,
        // WIP - typecheck should be user configurable, but hard code for now
        "x-typecheck": "false",
      };
      this.#setHeaders(
        { ...this.clientConfiguration, ...queryRequest },
        headers
      );

      const isTaggedFormat =
        (this.#clientConfiguration.format ?? "tagged") === "tagged" ||
        queryRequest.format === "tagged";
      const queryArgs = isTaggedFormat
        ? TaggedTypeFormat.encode(queryRequest.arguments)
        : queryRequest.arguments;

      const requestData = {
        query: queryRequest.query,
        arguments: queryArgs,
      };

      const fetchResponse = await this.#httpClient.request({
        url: this.#url,
        method: "POST",
        headers,
        data: requestData,
      });

      let parsedResponse: HTTPResponse;
      try {
        parsedResponse = {
          ...fetchResponse,
          body: isTaggedFormat
            ? TaggedTypeFormat.decode(fetchResponse.body)
            : JSON.parse(fetchResponse.body),
        };
      } catch (error: unknown) {
        throw new ProtocolError({
          message: `Error parsing response as JSON: ${error}`,
          httpStatus: fetchResponse.status,
        });
      }

      // Response is not from Fauna
      if (!isQuerySuccess(parsedResponse.body)) {
        throw this.#getError(parsedResponse);
      }

      const txn_ts = parsedResponse.body.txn_ts;
      if (
        (this.#lastTxnTs === undefined && txn_ts !== undefined) ||
        (txn_ts !== undefined &&
          this.#lastTxnTs !== undefined &&
          this.#lastTxnTs < txn_ts)
      ) {
        this.#lastTxnTs = txn_ts;
      }

      return parsedResponse.body as QuerySuccess<T>;
    } catch (e: any) {
      throw this.#getError(e);
    }
  }

  #setHeaders(fromObject: QueryRequestHeaders, headerObject: any): void {
    for (const entry of Object.entries(fromObject)) {
      if (
        [
          "format",
          "query_timeout_ms",
          "linearized",
          "max_contention_retries",
          "traceparent",
          "query_tags",
        ].includes(entry[0])
      ) {
        let headerValue: string;
        let headerKey = `x-${entry[0].replaceAll("_", "-")}`;
        if ("query_tags" === entry[0]) {
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
      headerObject["x-last-txn-ts"] === undefined &&
      this.#lastTxnTs !== undefined
    ) {
      headerObject["x-last-txn-ts"] = this.#lastTxnTs;
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
