/** following reference needed to include types for experimental fetch API in Node */
/// <reference lib="dom" />
export type FetchOptions = {
  body?: string;
  keepalive?: true;
  method?: string;
  headers?: Record<string, string>;
};
export type FetchResponse = {
  status: number;
  body: unknown;
};
export declare const isFetchResponse: (res: any) => res is FetchResponse;
export type FaunaFetch = (
  resource: string | URL,
  options: FetchOptions
) => Promise<FetchResponse>;
export declare const DefaultFetch: FaunaFetch;
