/** following reference needed to include types for experimental fetch API in Node */
/// <reference lib="dom" />

import { HTTPClient, HTTPRequest, HTTPResponse } from "./index";
import {
  NetworkError,
  ProtocolError,
  QueryFailure,
  QuerySuccess,
} from "../wire-protocol";

export class FetchClient implements HTTPClient {
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
      headers: requestHeaders,
      body: JSON.stringify(data),
      keepalive,
    })
      // handle network errors directly
      .catch((error) => {
        throw new NetworkError(
          "The network connection encountered a problem.",
          {
            cause: error,
          }
        );
      });

    const status = response.status;

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => (responseHeaders[key] = value));

    const body: QuerySuccess<unknown> | QueryFailure = await response
      .json()
      // handle JSON parsing errors directly
      .catch((error) => {
        throw new ProtocolError({
          message:
            "Error parsing response as JSON. Response: " +
            JSON.stringify(error),
          httpStatus: status,
        });
      });

    return {
      status,
      body,
      headers: responseHeaders,
    };
  }
}
