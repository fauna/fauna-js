import type { Client } from "../client";
export { FetchClient } from "./fetch-client";

/**
 * An object representing an http request.
 * The {@link Client} provides this to the {@link HTTPClient} implementation.
 */
export type HTTPRequest = {
  data: Record<string, any>;
  headers: Record<string, string>;
  method: string;
  url: string;
  keepalive?: boolean;
};

/**
 * An object representing an http request.
 * It is returned to, and handled by, the {@link Client}.
 */
export type HTTPResponse = {
  headers: Record<string, string>;
  status: number;
  body: string;
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
}
