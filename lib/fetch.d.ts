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
  status: number;
  body: QuerySuccess<T> | QueryFailure;
};
export type FaunaFetch = <T>(
  resource: string | URL,
  options: FetchOptions
) => Promise<FetchResponse<T>>;
export declare const DefaultFetch: FaunaFetch;
