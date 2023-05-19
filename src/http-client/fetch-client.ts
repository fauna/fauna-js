/** following reference needed to include types for experimental fetch API in Node */
/// <reference lib="dom" />

import { NetworkError } from "../errors";
import {
  HTTPClient,
  HTTPClientOptions,
  HTTPRequest,
  HTTPResponse,
} from "./http-client";

/**
 * An implementation for {@link HTTPClient} that uses the native fetch API
 */
export class FetchClient implements HTTPClient {
  #url: string;
  #keepalive: boolean;

  constructor({ url, fetch_keepalive }: HTTPClientOptions) {
    this.#url = new URL("/query/1", url).toString();
    this.#keepalive = fetch_keepalive;
  }

  /** {@inheritDoc HTTPClient.request} */
  async request({
    data,
    headers: requestHeaders,
    method,
    client_timeout_ms,
  }: HTTPRequest): Promise<HTTPResponse> {
    const response = await fetch(this.#url, {
      method,
      headers: { ...requestHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(client_timeout_ms),
      keepalive: this.#keepalive,
    }).catch((error) => {
      throw new NetworkError("The network connection encountered a problem.", {
        cause: error,
      });
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

  /** {@inheritDoc HTTPClient.close} */
  close() {
    // no actions at this time
  }
}
