/** following reference needed to include types for experimental fetch API in Node */
/// <reference lib="dom" />
import { HTTPClient, HTTPRequest, HTTPResponse } from "./index";
/**
 * An implementation for {@link HTTPClient} that uses the native fetch API
 */
export declare class FetchClient implements HTTPClient {
    /** {@inheritDoc HTTPClient.request} */
    request({ data, headers: requestHeaders, method, url, }: HTTPRequest): Promise<HTTPResponse>;
}
