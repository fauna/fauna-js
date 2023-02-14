/** following reference needed to include types for experimental fetch API in Node */
/// <reference lib="dom" />

import type { QueryFailure, QuerySuccess } from "./wire-protocol";

export type FetchOptions = {
  body?: string;
  keepalive?: true;
  method?: string;
  headers?: Record<string, string>;
};

export type FetchResponse<T> = {
  // headers: Record<string, string>,
  status: number;
  body: QuerySuccess<T> | QueryFailure;
};

export type FaunaFetch = <T>(
  resource: string | URL,
  options: FetchOptions
) => Promise<FetchResponse<T>>;

export const DefaultFetch: FaunaFetch = async <T>(
  resource: string | URL,
  options: FetchOptions
): Promise<FetchResponse<T>> => {
  const response = await fetch(resource, options);
  const status = response.status;
  const body = (await response.json()) as QuerySuccess<T> | QueryFailure;

  // TODO: include headers. typing for Headers.entries not available?
  // const headers = response.headers
  // const headersObj = Object.fromEntries(headers.entries())

  return {
    status,
    body,
  };
};
