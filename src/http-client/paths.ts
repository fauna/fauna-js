/**
 * Readonly object representing the paths of the Fauna API to be used
 * with HTTP clients.
 */
export const FaunaAPIPaths = {
  QUERY: "/query/1",
  STREAM: "/stream/1",
  CHANGE_FEED: "/changefeed/1",
} as const;

export type SupportedFaunaAPIPaths =
  (typeof FaunaAPIPaths)[keyof typeof FaunaAPIPaths];
