// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Client } from "../client";
import { QueryRequest, StreamRequest } from "../wire-protocol";
import { SupportedFaunaAPIPaths } from "./paths";

/**
 * An object representing an http request.
 * The {@link Client} provides this to the {@link HTTPClient} implementation.
 */
export type HTTPRequest<T = QueryRequest> = {
  /**
   * The timeout of each http request, in milliseconds.
   */
  client_timeout_ms: number;

  /** The encoded Fauna query to send */
  data: T;

  /** Headers in object format */
  headers: Record<string, string | undefined>;

  /** HTTP method to use */
  method: "POST";

  /** The path of the endpoint to call if not using the default */
  path?: SupportedFaunaAPIPaths;
};

/**
 * An object representing an http request.
 * It is returned to, and handled by, the {@link Client}.
 */
export type HTTPResponse = {
  body: string;
  headers: Record<string, string | string[] | undefined>;
  status: number;
};

export type HTTPClientOptions = {
  url: string;
  http2_session_idle_ms: number;
  http2_max_streams: number;
  fetch_keepalive: boolean;
};

/**
 * An interface to provide implementation-specific, asynchronous http calls.
 * This driver provides default implementations for common environments. Users
 * can configure the {@link Client} to use custom implementations if desired.
 */
export interface HTTPClient {
  /**
   * Makes an HTTP request and returns the response
   * @param req - an {@link HTTPRequest}
   * @returns A Promise&lt;{@link HTTPResponse}&gt;
   * @throws {@link NetworkError} on request timeout or other network issue.
   */
  request<T>(req: HTTPRequest<T>): Promise<HTTPResponse>;

  /**
   * Flags the calling {@link Client} as no longer
   * referencing this HTTPClient. Once no {@link Client} instances reference this HTTPClient
   * the underlying resources will be closed.
   * It is expected that calls to this method are _only_ made by a {@link Client}
   * instantiation. The behavior of direct calls is undefined.
   * @remarks
   * For some HTTPClients, such as the {@link FetchClient}, this method
   * is a no-op as there is no shared resource to close.
   */
  close(): void;
}

/**
 * An object representing an http request.
 * The {@link Client} provides this to the {@link HTTPStreamClient} implementation.
 */
export type HTTPStreamRequest = {
  /** The encoded Fauna query to send */
  // TODO: Allow type to be a QueryRequest once implemented by the db
  data: StreamRequest;

  /** Headers in object format */
  headers: Record<string, string | undefined>;

  /** HTTP method to use */
  method: "POST";

  /** The path of the endpoint to call if not using the default */
  path?: string;
};

/**
 * A common interface for a StreamClient to operate a stream from any HTTPStreamClient
 */
export interface StreamAdapter {
  read: AsyncGenerator<string>;
  close: () => void;
}

/**
 * An interface to provide implementation-specific, asynchronous http calls.
 * This driver provides default implementations for common environments. Users
 * can configure the {@link Client} to use custom implementations if desired.
 */
export interface HTTPStreamClient {
  /**
   * Makes an HTTP request and returns the response
   * @param req - an {@link HTTPStreamRequest}
   * @returns A Promise&lt;{@link HTTPResponse}&gt;
   * @throws {@link NetworkError} on request timeout or other network issue.
   */
  stream(req: HTTPStreamRequest): StreamAdapter;
}
