/** following reference needed to include types for experimental fetch API in Node */
/// <reference lib="dom" />
import { HTTPClient, HTTPRequest, HTTPResponse } from "./index";
export declare class FetchClient implements HTTPClient {
    request({ data, headers: requestHeaders, method, url, keepalive, }: HTTPRequest): Promise<HTTPResponse>;
}
