import { FetchClient } from "./fetch-client";
import { NodeHTTP2Client } from "./node-http2-client";
import {
  HTTPClient,
  HTTPClientOptions,
  HTTPRequest,
  HTTPResponse,
} from "./http-client";
import { isNode } from "../util/environment";

export const getDefaultHTTPClient = (options: HTTPClientOptions): HTTPClient =>
  isNode() ? NodeHTTP2Client.getClient(options) : new FetchClient(options);

export const isHTTPResponse = (res: any): res is HTTPResponse =>
  res instanceof Object && "body" in res && "headers" in res && "status" in res;

export { FetchClient, NodeHTTP2Client, HTTPClient, HTTPRequest, HTTPResponse };
