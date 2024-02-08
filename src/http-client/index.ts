import { FetchClient } from "./fetch-client";
import { HTTPClient, HTTPClientOptions, HTTPResponse } from "./http-client";
import { NodeHTTP2Client } from "./node-http2-client";

export * from "./fetch-client";
export * from "./http-client";
export * from "./node-http2-client";

export const getDefaultHTTPClient = (options: HTTPClientOptions): HTTPClient =>
  nodeHttp2IsSupported()
    ? NodeHTTP2Client.getClient(options)
    : new FetchClient(options);

export const isHTTPResponse = (res: any): res is HTTPResponse =>
  res instanceof Object && "body" in res && "headers" in res && "status" in res;

export const nodeHttp2IsSupported = () => {
  if (
    typeof process !== "undefined" &&
    process &&
    process.release?.name === "node"
  ) {
    try {
      require("node:http2");
      return true;
    } catch (_) {
      return false;
    }
  }
  return false;
};
