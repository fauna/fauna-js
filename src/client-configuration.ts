/**
 * Configuration for a client.
 */
export type ClientConfiguration = SharedOptions & {
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
};

/**
 * Query options that are not also statically configurable in the client
 *
 * TODO: add any other possible configuration options. On possibility is
 * allowing users to pass in query arguments without using a QueryBuilder here.
 */
export type QueryRequestOptions = SharedOptions;

/** tagged declares that type information is transmitted and received by the driver. "simple" indicates it is not. */
export type ValueFormat = "simple" | "tagged";

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

type SharedOptions = {
  /**
   * Determines the encoded format expected for the query `arguments` field, and
   * the `data` field of a successful response.
   * @remarks **Note, it is very unlikely you need to change this value from its default.**
   * By default the driver transmits type information over the wire. Fauna also assumes type information is
   * transmitted by default and thus leaving this value undefined will allow Fauna and the driver to send and
   * receive type data.
   *  Type information allows the driver and Fauna to distinguish between types such as int" and "long" which do not
   * have a standard way of distinguishing in JSON.
   * Since Fauna assumes typed information is transmitted by default, clients can leave this value undefined to make
   * full usage of Fauna's primitive types.
   * You can also explicitly set this to "tagged" to get the typing data sent.
   * Rare use cases can also deal with standard JSON by setting the value to "simple". Not that the types
   * enocodable in standard JSON are a subset of the types encodable in the default "tagged" format.
   * It is not recommended that users use the "simple" format as you will lose the typing of your data. e.g. a "Date"
   * will no longer be recognized by the Fauna as a "Date", but will instead be treated as a string.
   */
  format?: ValueFormat;
  /**
   * If true, unconditionally run the query as strictly serialized.
   * This affects read-only transactions. Transactions which write
   * will always be strictly serialized.
   * Overrides the optional setting for the client.
   */
  linearized?: boolean;
  /**
   * The max number of times to retry the query if contention is encountered.
   * Overrides the optional setting for the client.
   */
  max_contention_retries?: number;
  /**
   * Tags provided back via logging and telemetry.
   * Overrides the optional setting on the client.
   */
  query_tags?: Record<string, string>;
  /**
   * The timeout to use in this query in milliseconds.
   * Overrides the timeout for the client.
   */
  query_timeout_ms?: number;
  /**
   * A traceparent provided back via logging and telemetry.
   * Must match format: https://www.w3.org/TR/trace-context/#traceparent-header
   * Overrides the optional setting for the client.
   */
  traceparent?: string;
};
