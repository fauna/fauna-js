import { ClientConfiguration, endpoints } from "./client-configuration";
import {
  AuthenticationError,
  AuthorizationError,
  ClientClosedError,
  ClientError,
  NetworkError,
  ProtocolError,
  AbortError,
  QueryCheckError,
  QueryRuntimeError,
  QueryTimeoutError,
  ServiceError,
  ServiceInternalError,
  ServiceTimeoutError,
  ThrottlingError,
  ContendedTransactionError,
  InvalidRequestError,
} from "./errors";
import {
  getDefaultHTTPClient,
  isHTTPResponse,
  type HTTPClient,
} from "./http-client";
import { Query } from "./query-builder";
import { TaggedTypeFormat } from "./tagged-type";
import { getDriverEnv } from "./util/environment";
import { EmbeddedSet, Page, SetIterator } from "./values";
import {
  isQueryFailure,
  isQuerySuccess,
  QueryInterpolation,
  type QueryFailure,
  type QueryOptions,
  type QuerySuccess,
  type QueryValue,
} from "./wire-protocol";

type RequiredClientConfig = ClientConfiguration &
  Required<
    Pick<
      ClientConfiguration,
      | "client_timeout_buffer_ms"
      | "endpoint"
      | "fetch_keepalive"
      | "http2_max_streams"
      | "http2_session_idle_ms"
      | "secret"
      // required default query options
      | "format"
      | "long_type"
      | "query_timeout_ms"
    >
  >;

const DEFAULT_CLIENT_CONFIG: Omit<
  ClientConfiguration & RequiredClientConfig,
  "secret"
> = {
  client_timeout_buffer_ms: 5000,
  endpoint: endpoints.default,
  format: "tagged",
  http2_session_idle_ms: 5000,
  http2_max_streams: 100,
  long_type: "number",
  fetch_keepalive: false,
  query_timeout_ms: 5000,
};

/**
 * Client for calling Fauna.
 */
export class Client {
  /** A static copy of the driver env header to send with each request */
  static readonly #driverEnvHeader = getDriverEnv();

  /** The {@link ClientConfiguration} */
  readonly #clientConfiguration: RequiredClientConfig;
  /** The underlying {@link HTTPClient} client. */
  readonly #httpClient: HTTPClient;
  /** The last transaction timestamp this client has seen */
  #lastTxnTs?: number;
  /** true if this client is closed false otherwise */
  #isClosed = false;

  /**
   * Constructs a new {@link Client}.
   * @param clientConfiguration - the {@link ClientConfiguration} to apply. Defaults to recommended ClientConfiguraiton.
   * @param httpClient - The underlying {@link HTTPClient} that will execute the actual HTTP calls. Defaults to recommended HTTPClient.
   * @example
   * ```typescript
   *  const myClient = new Client(
   *   {
   *     endpoint: endpoints.cloud,
   *     secret: "foo",
   *     query_timeout_ms: 60_000,
   *   }
   * );
   * ```
   */
  constructor(
    clientConfiguration?: ClientConfiguration,
    httpClient?: HTTPClient
  ) {
    this.#clientConfiguration = {
      ...DEFAULT_CLIENT_CONFIG,
      ...clientConfiguration,
      secret: this.#getSecret(clientConfiguration),
    };

    this.#validateConfiguration();

    if (!httpClient) {
      this.#httpClient = getDefaultHTTPClient({
        url: this.#clientConfiguration.endpoint.toString(),
        http2_session_idle_ms: this.#clientConfiguration.http2_session_idle_ms,
        http2_max_streams: this.#clientConfiguration.http2_max_streams,
        fetch_keepalive: this.#clientConfiguration.fetch_keepalive,
      });
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
   * Closes the underlying HTTP client. Subsquent query or close calls
   * will fail.
   */
  close() {
    if (this.#isClosed) {
      throw new ClientClosedError(
        "Your client is closed. You cannot close it again."
      );
    }
    this.#httpClient.close();
    this.#isClosed = true;
  }

  /**
   * Creates an iterator to yield pages of data. If additional pages exist, the
   * iterator will lazily fetch addition pages on each iteration.
   *
   * @typeParam T - The expected type of the items returned from Fauna on each
   * iteration
   * @param iterable - a {@link Query} or an existing fauna Set ({@link Page} or
   * {@link EmbeddedSet})
   * @param options - a {@link QueryOptions} to apply to the queries. Optional.
   * @returns A {@link SetIterator} that lazily fetches new pages of data on
   * each iteration
   *
   * @example
   * ```javascript
   *  const userIterator = await client.paginate(fql`
   *    Users.all()
   *  `);
   *
   *  for await (const users of userIterator) {
   *    for (const user of users) {
   *      // do something with each user
   *    }
   *  }
   * ```
   *
   * @example
   * The {@link SetIterator.flatten} method can be used so the iterator yields
   * items directly. Each item is fetched asynchronously and hides when
   * additional pages are fetched.
   *
   * ```javascript
   *  const userIterator = await client.paginate(fql`
   *    Users.all()
   *  `);
   *
   *  for await (const user of userIterator.flatten()) {
   *    // do something with each user
   *  }
   * ```
   */
  paginate<T extends QueryValue>(
    iterable: Page<T> | EmbeddedSet | Query,
    options?: QueryOptions
  ): SetIterator<T> {
    if (iterable instanceof Query) {
      return SetIterator.fromQuery(this, iterable, options);
    }
    return SetIterator.fromPageable(this, iterable, options) as SetIterator<T>;
  }

  /**
   * Queries Fauna.
   *
   * @typeParam T - The expected type of the response from Fauna
   * @param query - a {@link Query} to execute in Fauna.
   *  Note, you can embed header fields in this object; if you do that there's no need to
   *  pass the headers parameter.
   * @param options - optional {@link QueryOptions} to apply on top of the request input.
   *   Values in this headers parameter take precedence over the same values in the {@link ClientConfiguration}.
   * @returns Promise&lt;{@link QuerySuccess}&gt;.
   *
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
   * @throws {@link ClientClosedError} if a query is issued after the client is closed.
   * due to an internal error.
   */
  async query<T extends QueryValue>(
    query: Query,
    options?: QueryOptions
  ): Promise<QuerySuccess<T>> {
    if (this.#isClosed) {
      throw new ClientClosedError(
        "Your client is closed. No further requests can be issued."
      );
    }

    // QueryInterpolation values must always be encoded.
    // TODO: The Query implementation never set the QueryRequest arguments.
    //   When we separate query building from query encoding we should be able
    //   to simply do `const queryInterpolation: TaggedTypeFormat.encode(query)`
    const queryInterpolation = query.toQuery(options).query;

    return this.#query(queryInterpolation, options);
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

  #getSecret(partialClientConfig?: ClientConfiguration): string {
    let fallback = undefined;
    if (
      typeof process !== "undefined" &&
      process &&
      typeof process === "object" &&
      process.env &&
      typeof process.env === "object"
    ) {
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
        if (QUERY_CHECK_FAILURE_CODES.includes(failure.error.code)) {
          return new QueryCheckError(failure, httpStatus);
        }
        if (failure.error.code === "invalid_request") {
          return new InvalidRequestError(failure, httpStatus);
        }
        if (
          failure.error.code === "abort" &&
          failure.error.abort !== undefined
        ) {
          return new AbortError(
            failure as QueryFailure & { error: { abort: QueryValue } },
            httpStatus
          );
        }
        return new QueryRuntimeError(failure, httpStatus);
      case 401:
        return new AuthenticationError(failure, httpStatus);
      case 403:
        return new AuthorizationError(failure, httpStatus);
      case 409:
        return new ContendedTransactionError(failure, httpStatus);
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

  async #query<T extends QueryValue>(
    queryInterpolation: string | QueryInterpolation,
    options?: QueryOptions
  ): Promise<QuerySuccess<T>> {
    try {
      const requestConfig = {
        ...this.#clientConfiguration,
        ...options,
      };

      const headers = {
        Authorization: `Bearer ${this.#clientConfiguration.secret}`,
      };
      this.#setHeaders(requestConfig, headers);

      const isTaggedFormat = requestConfig.format === "tagged";

      const queryArgs = requestConfig.arguments
        ? isTaggedFormat
          ? TaggedTypeFormat.encode(requestConfig.arguments)
          : requestConfig.arguments
        : undefined;

      const requestData = {
        query: queryInterpolation,
        arguments: queryArgs,
      };

      const client_timeout_ms =
        requestConfig.query_timeout_ms +
        this.#clientConfiguration.client_timeout_buffer_ms;

      const response = await this.#httpClient.request({
        client_timeout_ms,
        data: requestData,
        headers,
        method: "POST",
      });

      let parsedResponse;
      try {
        parsedResponse = {
          ...response,
          body: isTaggedFormat
            ? TaggedTypeFormat.decode(response.body, {
                long_type: requestConfig.long_type,
              })
            : JSON.parse(response.body),
        };
        if (parsedResponse.body.query_tags) {
          const tags_array = (parsedResponse.body.query_tags as string)
            .split(",")
            .map((tag) => tag.split("="));
          parsedResponse.body.query_tags = Object.fromEntries(tags_array);
        }
      } catch (error: unknown) {
        throw new ProtocolError({
          message: `Error parsing response as JSON: ${error}`,
          httpStatus: response.status,
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

  #setHeaders(
    fromObject: QueryOptions,
    headerObject: Record<string, string | number>
  ): void {
    for (const entry of Object.entries(fromObject)) {
      if (
        [
          "format",
          "query_timeout_ms",
          "linearized",
          "max_contention_retries",
          "traceparent",
          "typecheck",
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

    headerObject["x-driver-env"] = Client.#driverEnvHeader;
  }

  #validateConfiguration() {
    const config = this.#clientConfiguration;

    const required_options: (keyof RequiredClientConfig)[] = [
      "client_timeout_buffer_ms",
      "endpoint",
      "format",
      "http2_session_idle_ms",
      "long_type",
      "query_timeout_ms",
      "fetch_keepalive",
      "http2_max_streams",
    ];
    required_options.forEach((option) => {
      if (config[option] === undefined) {
        throw new TypeError(
          `ClientConfiguration option '${option}' must be defined.`
        );
      }
    });

    if (config.http2_max_streams <= 0) {
      throw new RangeError(`'http2_max_streams' must be greater than zero.`);
    }

    if (config.client_timeout_buffer_ms <= 0) {
      throw new RangeError(
        `'client_timeout_buffer_ms' must be greater than zero.`
      );
    }

    if (config.query_timeout_ms <= 0) {
      throw new RangeError(`'query_timeout_ms' must be greater than zero.`);
    }
  }
}

// Private types and constants for internal logic.

const QUERY_CHECK_FAILURE_CODES = [
  "invalid_function_definition",
  "invalid_identifier",
  "invalid_query",
  "invalid_syntax",
  "invalid_type",
];
