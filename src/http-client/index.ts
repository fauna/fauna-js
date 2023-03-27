// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Client } from "../client";
import { QueryRequest } from "../wire-protocol";
import { FetchClient } from "./fetch-client";
import { NodeHTTP2Client } from "./node-http2-client";

export { FetchClient } from "./fetch-client";
export { NodeHTTP2Client } from "./node-http2-client";

/**
 * An object representing an http request.
 * The {@link Client} provides this to the {@link HTTPClient} implementation.
 */
export type HTTPRequest = {
  data: QueryRequest;
  headers: Record<string, string | undefined>;
  method: "POST";
  url: string;
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
}

export const getDefaultHTTPClient = () =>
  isNode() ? NodeHTTP2Client.getClient() : new FetchClient();

// utility functions

export const isHTTPResponse = (res: any): res is HTTPResponse =>
  res instanceof Object && "body" in res && "headers" in res && "status" in res;

const isNode = () => process !== undefined && process.release?.name === "node";
