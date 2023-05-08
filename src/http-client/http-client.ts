// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Client } from "../client";
import { QueryRequest } from "../wire-protocol";

/**
 * An object representing an http request.
 * The {@link Client} provides this to the {@link HTTPClient} implementation.
 */
export type HTTPRequest = {
  /** The encoded Fauna query to send */
  data: QueryRequest;

  /** Headers in object format */
  headers: Record<string, string | undefined>;

  /**
   * Time in milliseconds the client will keep an HTTP2 session open after all
   * requests are completed. Only necessary for HTTP2 implementations.
   */
  http2_sessions_idle_ms: number;

  /** HTTP method to use */
  method: "POST";

  /** URL for the request */
  url: string;

  /**
   * The timeout of each query, in milliseconds. This controls the maximum amount of
   * time Fauna will execute your query before marking it failed.
   */
  client_timeout_ms?: number;
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

/**
 * An interface to provide implementation-specific, asyncronous http calls.
 * This driver provides default implementations for common environments. Users
 * can configure the {@link Client} to use custom implementations if desired.
 */
export interface HTTPClient {
  /**
   * Makes an HTTP request and returns the response
   * @param req - an {@link HTTPRequest}
   * @returns A Promise&lt;{@link HTTPResponse}&gt;
   */
  request(req: HTTPRequest): Promise<HTTPResponse>;

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
