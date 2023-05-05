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
export class FetchClient extends HTTPClient {
  constructor(options?: HTTPClientOptions) {
    super(options);
  }

  /** {@inheritDoc HTTPClient.request} */
  async request({
    data,
    headers: requestHeaders,
    method,
    url,
  }: HTTPRequest): Promise<HTTPResponse> {
    // TODO: handle client timeouts with AbortController. Emit NetworkError if so.

    let controller: AbortController;
    let signal: AbortSignal | undefined = undefined;
    if (this.client_timeout_ms !== undefined) {
      controller = new AbortController();
      signal = controller.signal;
      setTimeout(() => controller.abort(), this.client_timeout_ms);
    }

    const response = await fetch(url, {
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
