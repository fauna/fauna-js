import type { ValueFormat } from "./wire-protocol";

/**
 * Configuration for a client. The options provided are used as the
 * default options for each query.
 */
export interface ClientConfiguration {
  /**
   * Time in milliseconds beyond {@link ClientConfiguration.query_timeout_ms} at
   * which the client will abort a request if it has not received a response.
   * The default is 5000 ms, which should account for network latency for most
   * clients. The value must be greater than zero. The closer to zero the value
   * is, the more likely the client is to abort the request before the server
   * can report a legitimate response or error.
   */
  client_timeout_buffer_ms?: number;

  /**
   * The {@link URL} of Fauna to call. See {@link endpoints} for some default options.
   */
  endpoint?: URL;

  /**
   * Determines the encoded format expected for the query `arguments` field, and
   * the `data` field of a successful response.
   * @remarks **Note, it is very unlikely you need to change this value from its
   * default.**
   * The default format is "tagged", which specifies that the driver transmits
   * type information over the wire. Type information allows the driver and
   * Fauna to distinguish between types such as int" and "long" which do not
   * have a standard way of distinguishing in JSON.
   * Rare use cases can also deal with standard JSON by setting the value to
   * "simple". Note that the types enocodable in standard JSON are a subset of
   * the types encodable in the default "tagged" format.
   * It is not recommended that users use the "simple" format as you will lose
   * the typing of your data. e.g. a "Date" will no longer be recognized by the
   * Fauna as a "Date", but will instead be treated as a string.
   */
  format?: ValueFormat;

  /**
   * Time in milliseconds the client will keep an HTTP2 session open after all
   * requests are completed. The default is 5000 ms.
   */
  http2_session_idle_ms?: number;

  /**
   * The maximum number of HTTP2 streams to execute in parallel
   * to Fauna per HTTP2 session.
   * Only relevant to certain HTTP2 clients.
   * @remarks
   * Relevant to clients using the {@link NodeHTTP2Client} provided,
   * or any custom HTTP2Clients you implement that support this feature.
   */
  http2_max_streams?: number;

  /**
   * When true will keep executing a request even if the page
   * that fired the request is no longer executing. Only relevant
   * to underlying clients using the {@link https://fetch.spec.whatwg.org/ | Fetch standard}.
   * By default set to false.
   * @remarks
   * Relevant to clients using the {@link FetchClient} provided,
   * or any custom HTTP Clients you implement using the Fetch standard.
   */
  fetch_keepalive?: boolean;

  /**
   * A secret for your Fauna DB, used to authorize your queries.
   * @see https://docs.fauna.com/fauna/current/security/keys
   */
  secret?: string;

  // Query options

  /**
   * The timeout of each query, in milliseconds. This controls the maximum amount of
   * time Fauna will execute your query before marking it failed.
   * Default is undefined which let's Fauna determine the query timeout to apply. This
   * is recommended for most queries. The default is 5000 ms.
   */
  query_timeout_ms?: number;

  /**
   * If true, unconditionally run the query as strictly serialized.
   * This affects read-only transactions. Transactions which write
   * will always be strictly serialized.
   */
  linearized?: boolean;

  /**
   * Controls what Javascript type to deserialize {@link https://fqlx-beta--fauna-docs.netlify.app/fqlx/beta/reference/language/types#long | Fauna longs} to.
   * Use 'number' to deserialize longs to number. Use 'bigint' to deserialize to bigint. Defaults to 'number'.
   * Note, for extremely large maginitude numbers Javascript's number will lose precision; as Javascript's
   * 'number' can only support +/- 2^53-1 whereas Fauna's long is 64 bit. If this is detected, a warning will
   * be logged to the console and precision loss will occur.
   * If your application uses extremely large magnitude numbers use 'bigint'.
   */
  long_type?: "number" | "bigint";

  /**
   * The max number of times to retry the query if contention is encountered.
   */
  max_contention_retries?: number;

  /**
   * Tags provided back via logging and telemetry.
   */
  query_tags?: { [key: string]: string };

  /**
   * A traceparent provided back via logging and telemetry.
   * Must match format: https://www.w3.org/TR/trace-context/#traceparent-header
   */
  traceparent?: string;

  /**
   * Enable or disable typechecking of the query before evaluation. If no value
   * is provided, the value of `typechecked` in the database configuration will
   * be used.
   */
  typecheck?: boolean;
}

/**
 * An extensible interface for a set of Fauna endpoints.
 * @remarks Leverage the `[key: string]: URL;` field to extend to other endpoints.
 */
export interface Endpoints {
  /** Fauna's default endpoint. */
  default: URL;

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
  default: new URL("https://db.fauna.com"),
  local: new URL("http://localhost:8443"),
  localhost: new URL("http://localhost:8443"),
};
