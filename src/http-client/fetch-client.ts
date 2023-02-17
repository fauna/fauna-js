/** following reference needed to include types for experimental fetch API in Node */
/// <reference lib="dom" />

import { HTTPClient, HTTPRequest, HTTPResponse } from "./index";

/**
 * An implementation for {@link HTTPClient} that uses the native fetch API
 */
export class FetchClient implements HTTPClient {
  /** {@inheritDoc HTTPClient.request} */
  async request({
    data,
    headers: requestHeaders,
    method,
    url,
    keepalive,
  }: HTTPRequest): Promise<HTTPResponse> {
    // TODO: handle client timeouts with AbortController. Emit NetworkError if so.

    const response = await fetch(url, {
      method,
      headers: { ...requestHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(data),
      keepalive,
    });

    const status = response.status;

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => (responseHeaders[key] = value));

    const body = await response.text();

    return {
      status,
      body,
      headers: responseHeaders,
    };
  }
}
