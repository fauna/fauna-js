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

  constructor({ url }: HTTPClientOptions) {
    this.#url = url;
  }

  /** {@inheritDoc HTTPClient.request} */
  async request({
    data,
    headers: requestHeaders,
    method,
    client_timeout_ms,
  }: HTTPRequest): Promise<HTTPResponse> {
    const controller = new AbortController();
    const signal = controller.signal;
    setTimeout(() => controller.abort(), client_timeout_ms);

    const response = await fetch(this.#url, {
      method,
      headers: { ...requestHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal,
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
