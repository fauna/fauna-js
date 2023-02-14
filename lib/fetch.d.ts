/** following reference needed to include types for experimental fetch API in Node */
/// <reference lib="dom" />
import type { QueryFailure, QuerySuccess } from "./wire-protocol";
export declare type FetchOptions = {
  body?: string;
  keepalive?: true;
  method?: string;
  headers?: Record<string, string>;
};
export declare type FetchResponse<T> = {
  status: number;
  body: QuerySuccess<T> | QueryFailure;
};
export declare type FaunaFetch = <T>(
  resource: string | URL,
  options: FetchOptions
) => Promise<FetchResponse<T>>;
export declare const DefaultFetch: FaunaFetch;
