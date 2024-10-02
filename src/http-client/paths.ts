/**
 * Readonly object representing the paths of the Fauna API to be used
 * with HTTP clients.
 */
export const FaunaAPI = {
  QUERY: "/query/1",
  STREAM: "/stream/1",
} as const;
