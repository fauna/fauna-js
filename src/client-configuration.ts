/**
 * Configuration for a client.
 */
export interface ClientConfiguration {
  /**
   * The {@link URL} of Fauna to call. See {@link endpoints} for some default options.
   */
  endpoint: URL;
  /**
   * A secret for your Fauna DB, used to authorize your queries.
   * @see https://docs.fauna.com/fauna/current/security/keys
   */
  secret: string;
  /**
   * The timeout of the query, in milliseconds. This controls the maximum amount of
   * time Fauna will execute your query before marking it failed.
   */
  queryTimeoutMillis: number;
}

/**
 * An extensible interface for a set of Fauna endpoints.
 * @remarks Leverage the `[key: string]: URL;` field to extend to other endpoints.
 */
export interface Endpoints {
  /** Fauna's cloud endpoint. */
  cloud: URL;
  /**
   * An endpoint for interacting with local instance of Fauna (e.g. one running in a local docker container).
   */
  local: URL;
  /**
   * Any other endpoint you want your client to support. For example, if you run all requests through a proxy
   * configure it here. Most clients will not need to leverage this ability.
   */
  [key: string]: URL;
}

/**
 * A extensible set of endpoints for calling Fauna.
 * @remarks Most clients will will not need to extend this set.
 * @example
 * ## To Extend
 * ```typescript
 *   // add to the endpoints constant
 *   endpoints.myProxyEndpoint = new URL("https://my.proxy.url");
 * ```
 */
export const endpoints: Endpoints = {
  cloud: new URL("https://db.fauna.com"),
  local: new URL("http://localhost:8443"),
};
