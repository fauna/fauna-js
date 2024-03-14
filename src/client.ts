import {
  ClientConfiguration,
  StreamClientConfiguration,
  endpoints,
} from "./client-configuration";
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
  FaunaError,
} from "./errors";
import {
  HTTPStreamClient,
  StreamAdapter,
  getDefaultHTTPClient,
  implementsStreamClient,
  isHTTPResponse,
  type HTTPClient,
} from "./http-client";
import { Query } from "./query-builder";
import { TaggedTypeFormat } from "./tagged-type";
import { getDriverEnv } from "./util/environment";
import { EmbeddedSet, Page, SetIterator, StreamToken } from "./values";
import {
  isQueryFailure,
  isQuerySuccess,
  QueryInterpolation,
  StreamEvent,
  StreamEventData,
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
      | "max_attempts"
      | "max_backoff"
    >
  >;

const DEFAULT_CLIENT_CONFIG: Omit<
  ClientConfiguration & RequiredClientConfig,
  "secret" | "endpoint"
> = {
  client_timeout_buffer_ms: 5000,
  format: "tagged",
  http2_session_idle_ms: 5000,
  http2_max_streams: 100,
  long_type: "number",
  fetch_keepalive: false,
  query_timeout_ms: 5000,
  max_attempts: 3,
  max_backoff: 20,
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
  readonly #httpClient: HTTPClient & Partial<HTTPStreamClient>;
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
      endpoint: this.#getEndpoint(clientConfiguration),
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
  get lastTxnTs(): number | undefined {
    return this.#lastTxnTs;
  }
  /**
   * Sets the last transaction time of this client.
   * @param ts - the last transaction timestamp to set, as microseconds since
   *   the epoch. If `ts` is less than the existing `#lastTxnTs` value or is
   *   undefined , then no change is made.
   */
  set lastTxnTs(ts: number | undefined) {
    if (ts !== undefined) {
      this.#lastTxnTs = this.#lastTxnTs ? Math.max(ts, this.#lastTxnTs) : ts;
    }
  }

  /**
   * Return the {@link ClientConfiguration} of this client.
   */
  get clientConfiguration(): ClientConfiguration {
    const { ...copy } = this.#clientConfiguration;
    return copy;
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
   * iterator will lazily fetch addition pages on each iteration. Pages will
   * be retried in the event of a ThrottlingError up to the client's configured
   * max_attempts, inclusive of the initial call.
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
   * Queries Fauna. Queries will be retried in the event of a ThrottlingError up to the client's configured
   * max_attempts, inclusive of the initial call.
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

    return this.#queryWithRetries(queryInterpolation, options);
  }

  /**
   * Initialize a streaming request to Fauna
   * @param query - A string-encoded streaming token, or a {@link Query}
   * @returns A {@link StreamClient} that which can be used to listen to a stream
   * of events
   *
   * @example
   * ```javascript
   *  const stream = client.stream(fql`MyCollection.all().toStream()`)
   *
   *  try {
   *    for await (const event of stream) {
   *      switch (event.type) {
   *        case "update":
   *        case "add":
   *        case "remove":
   *          console.log("Stream update:", event);
   *          // ...
   *          break;
   *      }
   *    }
   *  } catch (error) {
   *    // An error will be handled here if Fauna returns a terminal, "error" event, or
   *    // if Fauna returns a non-200 response when trying to connect, or
   *    // if the max number of retries on network errors is reached.
   *
   *    // ... handle fatal error
   *  };
   * ```
   *
   * @example
   * ```javascript
   *  const stream = client.stream(fql`MyCollection.all().toStream()`)
   *
   *  stream.start(
   *    function onEvent(event) {
   *      switch (event.type) {
   *        case "update":
   *        case "add":
   *        case "remove":
   *          console.log("Stream update:", event);
   *          // ...
   *          break;
   *      }
   *    },
   *    function onError(error) {
   *      // An error will be handled here if Fauna returns a terminal, "error" event, or
   *      // if Fauna returns a non-200 response when trying to connect, or
   *      // if the max number of retries on network errors is reached.
   *
   *      // ... handle fatal error
   *    }
   *  );
   * ```
   */
  // TODO: implement options
  stream(query: Query | StreamToken): StreamClient {
    if (this.#isClosed) {
      throw new ClientClosedError(
        "Your client is closed. No further requests can be issued."
      );
    }

    const streamClient = this.#httpClient;

    if (implementsStreamClient(streamClient)) {
      const getStreamToken: () => Promise<StreamToken> =
        query instanceof Query
          ? () =>
              this.query(query).then((res) => {
                const maybeStreamToken = res.data;
                if (!(maybeStreamToken instanceof StreamToken)) {
                  throw new ClientError(
                    `Error requesting a stream token. Expected a StreamToken as the query result, but received ${typeof maybeStreamToken}. Your query must return the result of '<Set>.toStream' or '<Set>.changesOn')\n` +
                      `Query result: ${JSON.stringify(maybeStreamToken, null)}`
                  );
                }
                return maybeStreamToken;
              })
          : () => Promise.resolve(query as StreamToken);

      return new StreamClient(
        getStreamToken,
        this.#clientConfiguration,
        streamClient
      );
    } else {
      throw new ClientError("Streaming is not supported by this client.");
    }
  }

  async #queryWithRetries<T extends QueryValue>(
    queryInterpolation: string | QueryInterpolation,
    options?: QueryOptions,
    attempt = 0
  ): Promise<QuerySuccess<T>> {
    const maxBackoff =
      this.clientConfiguration.max_backoff ?? DEFAULT_CLIENT_CONFIG.max_backoff;
    const maxAttempts =
      this.clientConfiguration.max_attempts ??
      DEFAULT_CLIENT_CONFIG.max_attempts;
    const backoffMs =
      Math.min(Math.random() * 2 ** attempt, maxBackoff) * 1_000;

    attempt += 1;

    try {
      return await this.#query<T>(queryInterpolation, options, attempt);
    } catch (error) {
      if (error instanceof ThrottlingError && attempt < maxAttempts) {
        await wait(backoffMs);
        return this.#queryWithRetries<T>(queryInterpolation, options, attempt);
      }
      throw error;
    }
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
    let env_secret = undefined;
    if (
      typeof process !== "undefined" &&
      process &&
      typeof process === "object" &&
      process.env &&
      typeof process.env === "object"
    ) {
      env_secret = process.env["FAUNA_SECRET"];
    }

    const maybeSecret = partialClientConfig?.secret ?? env_secret;
    if (maybeSecret === undefined) {
      throw new TypeError(
        "You must provide a secret to the driver. Set it \
in an environmental variable named FAUNA_SECRET or pass it to the Client\
 constructor."
      );
    }
    return maybeSecret;
  }

  #getEndpoint(partialClientConfig?: ClientConfiguration): URL {
    // If the user explicitly sets the endpoint to undefined, we should throw a
    // TypeError, rather than override with the default endpoint.
    if (
      partialClientConfig &&
      "endpoint" in partialClientConfig &&
      partialClientConfig.endpoint === undefined
    ) {
      throw new TypeError(
        `ClientConfiguration option endpoint must be defined.`
      );
    }

    let env_endpoint: URL | undefined = undefined;
    if (
      typeof process !== "undefined" &&
      process &&
      typeof process === "object" &&
      process.env &&
      typeof process.env === "object"
    ) {
      env_endpoint = process.env["FAUNA_ENDPOINT"]
        ? new URL(process.env["FAUNA_ENDPOINT"])
        : undefined;
    }

    return partialClientConfig?.endpoint ?? env_endpoint ?? endpoints.default;
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
    options?: QueryOptions,
    attempt = 0
  ): Promise<QuerySuccess<T>> {
    try {
      const requestConfig = {
        ...this.#clientConfiguration,
        ...options,
      };

      const headers = {
        Authorization: `Bearer ${requestConfig.secret}`,
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

      const res = parsedResponse.body as QuerySuccess<T>;
      if (res.stats) {
        res.stats.attempts = attempt;
      }
      return res;
    } catch (e: any) {
      throw this.#getError(e);
    }
  }

  #setHeaders(
    fromObject: QueryOptions,
    headerObject: Record<string, string | number>
  ): void {
    const setHeader = <V>(
      header: string,
      value: V | undefined,
      transform: (v: V) => string | number = (v) => String(v)
    ) => {
      if (value !== undefined) {
        headerObject[header] = transform(value);
      }
    };

    setHeader("x-format", fromObject.format);
    setHeader("x-typecheck", fromObject.typecheck);
    setHeader("x-query-timeout-ms", fromObject.query_timeout_ms);
    setHeader("x-linearized", fromObject.linearized);
    setHeader("x-max-contention-retries", fromObject.max_contention_retries);
    setHeader("traceparent", fromObject.traceparent);
    setHeader("x-query-tags", fromObject.query_tags, (tags) =>
      Object.entries(tags)
        .map((tag) => tag.join("="))
        .join(",")
    );
    setHeader("x-last-txn-ts", this.#lastTxnTs, (v) => v); // x-last-txn-ts doesn't get stringified
    setHeader("x-driver-env", Client.#driverEnvHeader);
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

/**
 * A class to listen to Fauna streams.
 */
export class StreamClient {
  /** Whether or not this stream has been closed */
  closed = false;
  /** The stream client options */
  #clientConfiguration: Record<string, any>;
  /** A tracker for the number of connection attempts */
  #connectionAttempts = 0;
  /** The underlying {@link HTTPStreamClient} that will execute the actual HTTP calls */
  #httpStreamClient: HTTPStreamClient;
  /** A lambda that returns a promise for a {@link StreamToken} */
  #query: () => Promise<StreamToken>;
  /** The last `txn_ts` value received from events */
  #last_ts?: number;
  /** A common interface to operate a stream from any HTTPStreamClient */
  #streamAdapter?: StreamAdapter;
  /** A saved copy of the StreamToken once received */
  #streamToken?: StreamToken;

  /**
   *
   * @param query - A lambda that returns a promise for a {@link StreamToken}
   * @param clientConfiguration - The {@link ClientConfiguration} to apply
   * @param httpStreamClient - The underlying {@link HTTPStreamClient} that will
   * execute the actual HTTP calls
   * @example
   * ```typescript
   *  const streamClient = client.stream(streamToken);
   * ```
   */
  // TODO: implement stream-specific options
  constructor(
    query: () => Promise<StreamToken>,
    clientConfiguration: StreamClientConfiguration,
    httpStreamClient: HTTPStreamClient
  ) {
    this.#query = query;
    this.#clientConfiguration = clientConfiguration;
    this.#httpStreamClient = httpStreamClient;
  }

  /**
   * A synchronous method to start listening to the stream and handle events
   * using callbacks.
   * @param onEvent - A callback function to handle each event
   * @param onError - An Optional callback function to handle errors. If none is
   * provided, error will not be handled, and the stream will simply end.
   */
  start(
    onEvent: (event: StreamEventData) => void,
    onError: (error: Error) => void
  ) {
    if (typeof onEvent !== "function") {
      throw new TypeError(
        `Expected a function as the 'onEvent' argument, but received ${typeof onEvent}. Please provide a valid function.`
      );
    }
    if (onError && typeof onError !== "function") {
      throw new TypeError(
        `Expected a function as the 'onError' argument, but received ${typeof onError}. Please provide a valid function.`
      );
    }
    const run = async () => {
      try {
        for await (const event of this) {
          onEvent(event);
        }
      } catch (error) {
        if (onError) {
          onError(error as Error);
        }
      }
    };
    run();
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<StreamEventData> {
    if (this.closed) {
      throw new ClientError("The stream has been closed and cannot be reused.");
    }

    if (!this.#streamToken) {
      this.#streamToken = await this.#query();
    }

    // TODO: make these constants configurable
    const STREAM_RECONNECT_MAX_ATTEMPTS = 60;
    const STREAM_RECONNECT_MAX_BACKOFF = 10;

    while (!this.closed) {
      const backoffMs =
        Math.min(
          Math.random() * 2 ** this.#connectionAttempts,
          STREAM_RECONNECT_MAX_BACKOFF
        ) * 1_000;

      this.#connectionAttempts = 1;
      try {
        for await (const event of this.#startStream(this.#last_ts)) {
          yield event;
        }
      } catch (error: any) {
        if (
          error instanceof FaunaError ||
          this.#connectionAttempts >= STREAM_RECONNECT_MAX_ATTEMPTS
        ) {
          // A terminal error from Fauna
          this.close();
          throw error;
        }

        this.#connectionAttempts += 1;
        await wait(backoffMs);
      }
    }
  }

  close() {
    if (this.#streamAdapter) {
      this.#streamAdapter.close();
      this.#streamAdapter = undefined;
    }
    this.closed = true;
  }

  get last_ts(): number | undefined {
    return this.#last_ts;
  }

  async *#startStream(start_ts?: number): AsyncGenerator<StreamEventData> {
    // Safety: This method must only be called after a stream token has been acquired
    const streamToken = this.#streamToken as StreamToken;

    const headers = {
      Authorization: `Bearer ${this.#clientConfiguration.secret}`,
    };

    const streamAdapter = this.#httpStreamClient.stream({
      data: { token: streamToken.token, start_ts },
      headers,
      method: "POST",
    });

    this.#streamAdapter = streamAdapter;

    for await (const event of streamAdapter.read) {
      // stream events are always tagged
      const deserializedEvent: StreamEvent = TaggedTypeFormat.decode(event, {
        long_type: this.#clientConfiguration.long_type,
      });

      if (deserializedEvent.type === "error") {
        // Errors sent from Fauna are assumed fatal
        this.close();
        // TODO: replace with appropriate class from existing error heirarchy
        throw new ServiceError(deserializedEvent, 400);
      }

      this.#last_ts = deserializedEvent.txn_ts;

      if (deserializedEvent.type !== "status") {
        yield deserializedEvent;
      }
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

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
