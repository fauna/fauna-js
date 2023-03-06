// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Client } from "../client";
import { QueryRequest } from "../wire-protocol";
import { FetchClient } from "./fetch-client";
export { FetchClient } from "./fetch-client";

/**
 * An object representing an http request.
 * The {@link Client} provides this to the {@link HTTPClient} implementation.
 */
export type HTTPRequest = {
  data: QueryRequest;
  headers: Record<string, string | undefined>;
  method: string;
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

// The following line is the minimum needed for Node, but requires the
//   "./node-http2-client" module to be imported, which the browser build cannot
// export const getDefaultHTTPClient = () => isNode() ? NodeHTTP2Client.getClient() : new FetchClient();

// So here is an attempt at using dynamic imports, but esbuild is not smart
//   enough to ignore "./node-http2-client"
export const getDefaultHTTPClient = () => {
  if (isNode()) {
    try {
      let NodeHTTP2Client;
      let loading = true;
      import("./node-http2-client").then((module) => {
        NodeHTTP2Client = module.NodeHTTP2Client;
        loading = false;
      });
      // spin until module is loaded
      // eslint-disable-next-line no-empty
      while (loading) {}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return NodeHTTP2Client.getClient();
    } catch (_) {
      return new FetchClient();
    }
  }
  return new FetchClient();
};

// utility functions

export const isHTTPResponse = (res: any): res is HTTPResponse =>
  res instanceof Object && "body" in res && "headers" in res && "status" in res;

const isNode = () => process instanceof Object && "node" in process;
