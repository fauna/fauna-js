import type { FaunaFetch } from "./fetch";

/**
 * Configuration for a client.
 */
export interface ClientConfiguration {
  /**
   * The {@link URL} of Fauna to call. See {@link endpoints} for some default options.
   */
  endpoint: URL;
  /**
   * The maximum number of connections to a make to Fauna.
   */
  max_conns: number;
  /**
   * A secret for your Fauna DB, used to authorize your queries.
   * @see https://docs.fauna.com/fauna/current/security/keys
   */
  secret: string;
  /**
   * The timeout of each query, in milliseconds. This controls the maximum amount of
   * time Fauna will execute your query before marking it failed.
   */
  timeout_ms: number;
  /**
   * If true, unconditionally run the query as strictly serialized.
   * This affects read-only transactions. Transactions which write
   * will always be strictly serialized.
   */
  linearized?: boolean;
  /**
   * The max number of times to retry the query if contention is encountered.
   */
  max_contention_retries?: number;

  /**
   * Tags provided back via logging and telemetry.
   */
  tags?: { [key: string]: string };
  /**
   * A traceparent provided back via logging and telemetry.
   * Must match format: https://www.w3.org/TR/trace-context/#traceparent-header
   */
  traceparent?: string;

  /**
   * Wrapper for the HTTP requests, modeled after the web API. Can be provided by the user.
   */
  fetch: FaunaFetch;
}

/**
 * An extensible interface for a set of Fauna endpoints.
 * @remarks Leverage the `[key: string]: URL;` field to extend to other endpoints.
 */
export interface Endpoints {
  /** Fauna's cloud endpoint. */
  cloud: URL;
  /** Fauna's preview endpoint for testing new features - requires beta access. */
  preview: URL;
  /**
   * An endpoint for interacting with local instance of Fauna (e.g. one running in a local docker container).
   */
  local: URL;
  /**
   * An alias for local.
   */
  localhost: URL;
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
  preview: new URL("https://db.fauna-preview.com"),
  local: new URL("http://localhost:8443"),
  localhost: new URL("http://localhost:8443"),
};
