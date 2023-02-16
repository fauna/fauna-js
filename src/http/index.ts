/** following reference needed to include types for experimental fetch API in Node */
/// <reference lib="dom" />

import {
  NetworkError,
  ProtocolError,
  QueryFailure,
  QuerySuccess,
} from "../wire-protocol";

export type FetchOptions = {
  body?: string;
  keepalive?: true;
  method?: string;
  headers?: Record<string, string>;
};

export type FetchResponse = {
  // headers: Record<string, string>,
  status: number;
  body: unknown;
};

export const isFetchResponse = (res: any): res is FetchResponse =>
  "status" in res && "body" in res;

export type FaunaFetch = (
  resource: string | URL,
  options: FetchOptions
) => Promise<FetchResponse>;

export const DefaultFetch: FaunaFetch = async (
  resource: string | URL,
  options: FetchOptions
): Promise<FetchResponse> => {
  // TODO: handle client timeouts with AbortController. Emit NetworkError if so.

  const response = await fetch(resource, options)
    // handle network errors directly
    .catch((error) => {
      throw new NetworkError("The network connection encountered a problem.", {
        cause: error,
      });
    });

  const status = response.status;

  // TODO: include headers. typing for Headers.entries not available?
  // const headers = response.headers
  // const headersObj = Object.fromEntries(headers.entries())

  const body: QuerySuccess<unknown> | QueryFailure = await response
    .json()
    // handle JSON parsing errors directly
    .catch((error) => {
      throw new ProtocolError(
        "Error parsing response as JSON. Response: " + JSON.stringify(error),
        status
      );
    });

  return {
    status,
    body,
  };
};
