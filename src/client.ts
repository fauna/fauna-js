import axios, { AxiosInstance } from "axios";
import type { ClientConfiguration } from "./client-configuration";
import Agent, { HttpsAgent } from "agentkeepalive";
import {
  AuthenticationError,
  AuthorizationError,
  ClientError,
  NetworkError,
  ProtocolError,
  QueryCheckError,
  QueryCheckFailure,
  QueryRuntimeError,
  QueryTimeoutError,
  ServiceError,
  ServiceInternalError,
  ServiceTimeoutError,
  type Span,
  ThrottlingError,
  type QueryRequest,
  type QueryResponse,
} from "./wire-protocol";

/**
 * Client for calling Fauna.
 */
export class Client {
  /** The {@link ClientConfiguration} */
  readonly clientConfiguration: ClientConfiguration;
  /** The underlying {@link AxiosInstance} client. */
  readonly client: AxiosInstance;
  /** last_txn this client has seen */
  #lastTxn?: Date;

  /**
   * Constructs a new {@link Client}.
   * @param clientConfiguration - the {@link ClientConfiguration} to apply.
   * @example
   * ```typescript
   *  const myClient = new Client(
   *   {
   *     endpoint: endpoints.classic,
   *     secret: "foo",
   *     queryTimeoutMs: 60_000,
   *   }
   * );
   * ```
   */
  constructor(clientConfiguration: ClientConfiguration) {
    this.clientConfiguration = clientConfiguration;
    // ensure the network timeout > ClientConfiguration.queryTimeoutMillis so we don't
    // terminate connections on active queries.
    const timeout = this.clientConfiguration.timeout_ms + 10_000;
    const agentSettings = {
      maxSockets: this.clientConfiguration.max_conns,
      maxFreeSockets: this.clientConfiguration.max_conns,
      timeout,
      // release socket for usage after 4s of inactivity. Must be less than Fauna's server
      // side idle timeout of 5 seconds.
      freeSocketTimeout: 4000,
      keepAlive: true,
    };
    this.client = axios.create({
      baseURL: this.clientConfiguration.endpoint.toString(),
      timeout,
    });
    this.client.defaults.httpAgent = new Agent(agentSettings);
    this.client.defaults.httpsAgent = new HttpsAgent(agentSettings);
    this.client.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${this.clientConfiguration.secret}`;
    this.client.defaults.headers.common["Content-Type"] = "application/json";
    this.#setHeaders(clientConfiguration, this.client.defaults.headers.common);
  }

  /**
   * Queries Fauna.
   * @param queryRequest - the {@link QueryRequest}
   * @returns {@link QueryResponse}.
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
  async query<T = any>(queryRequest: QueryRequest): Promise<QueryResponse<T>> {
    const { query } = queryRequest;
    const headers: { [key: string]: string } = {};
    this.#setHeaders(queryRequest, headers);
    try {
      const result = await this.client.post<QueryResponse<T>>(
        "/query/1",
        { query },
        { headers }
      );
      const txnDate = new Date(result.data.txn_time);
      if (this.#lastTxn === undefined || this.#lastTxn < txnDate) {
        this.#lastTxn = txnDate;
      }
      return result.data;
    } catch (e: any) {
      throw this.#getError(e);
    }
  }

  #getError(e: any): ServiceError | ProtocolError | NetworkError | ClientError {
    // see: https://axios-http.com/docs/handling_errors
    if (e.response) {
      // we got an error from the fauna service
      if (e.response.data?.error) {
        return this.#getServiceError(e.response.data.error, e.response.status);
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
    error: {
      code: string;
      message: string;
      summary?: string;
      failures?: Array<QueryCheckFailure>;
      stats?: { [key: string]: number };
      trace?: Array<Span>;
      txn_time?: string;
    },
    httpStatus: number
  ): ServiceError {
    if (httpStatus === 401) {
      return new AuthenticationError({ httpStatus, ...error });
    }
    if (httpStatus === 403) {
      return new AuthorizationError({ httpStatus, ...error });
    }
    if (httpStatus === 500) {
      return new ServiceInternalError({ httpStatus, ...error });
    }
    if (httpStatus === 503) {
      return new ServiceTimeoutError({ httpStatus, ...error });
    }
    if (httpStatus === 429) {
      return new ThrottlingError({ httpStatus, ...error });
    }
    if (httpStatus === 440) {
      // TODO stats not yet returned. Include it when it is.
      return new QueryTimeoutError({ httpStatus, ...error });
    }
    // TODO trace, txn_time, and stats not yet returned for QueryRuntimeError
    // flip to check for those rather than a specific code.
    if (httpStatus === 400 && error.code === "invalid_argument") {
      return new QueryRuntimeError({ httpStatus, ...error });
    }
    if (httpStatus === 400 && error.failures !== undefined) {
      // same trick
      return new QueryCheckError({
        httpStatus,
        ...error,
        failures: error.failures,
      });
    }
    return new ServiceError({ httpStatus, ...error });
  }

  #setHeaders(fromObject: RequestHeaders, headerObject: any): void {
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
        let headerValue;
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

interface RequestHeaders {
  last_txn?: string;
  linearized?: boolean;
  timeout_ms?: number;
  max_contention_retries?: number;
  tags?: { [key: string]: string };
  traceparent?: string;
}
