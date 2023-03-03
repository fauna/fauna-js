
import { fql } from "../query-builder";

/**
 * A request to make to Fauna.
 */
export interface QueryRequest extends QueryRequestHeaders {
  /** The query */
  query: string | QueryInterpolation;

  /** Optional arguments. Variables in the query will be initialized to the
   * value associated with an argument key.
   */
  arguments?: JSONObject;
}

export interface QueryRequestHeaders {
  /**
   * Determines the encoded format expected for the query `arguments` field, and
   * the `data` field of a successful response.
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
   * The timeout to use in this query in milliseconds.
   * Overrides the timeout for the client.
   */
  query_timeout_ms?: number;
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
   * A traceparent provided back via logging and telemetry.
   * Must match format: https://www.w3.org/TR/trace-context/#traceparent-header
   * Overrides the optional setting for the client.
   */
  traceparent?: string;
}

/** tagged declares that type information is transmitted and received by the driver. "simple" indicates it is not. */
export declare type ValueFormat = "simple" | "tagged";

/**
 * A piece of an interpolated query. Interpolated queries can be safely composed
 * together without concern of query string injection.
 * @see {@link ValueFragment} and {@link FQLFragment} for additional
 * information
 */
export type QueryInterpolation = FQLFragment | ValueFragment;

/**
 * A piece of an interpolated query that represents an actual value. Arguments
 * are passed to fauna using ValueFragments so that query string injection is
 * not possible.
 * @remarks A ValueFragment is created by this driver when a literal value or
 * object is provided as an argument to the {@link fql} tagged template
 * function.
 *
 * ValueFragments must always be encoded with tags, regardless of the "x-format"
 * request header sent.
 * @example
 * ```typescript
 *  const num = 17;
 *  const query = fql`${num} + 3)`;
 *  // produces
 *  { fql: [{ value: { "@int": "17" } }, " + 3"] }
 * ```
 */
export type ValueFragment = { value: JSONValue };

/**
 * A piece of an interpolated query. Interpolated Queries can be safely composed
 * together without concern of query string injection.
 * @remarks A FQLFragment is created when calling the {@link fql} tagged
 * template function and can be passed as an argument to other QueryBuilders.
 * @example
 * ```typescript
 *  const num = 17;
 *  const query1 = fql`${num} + 3)`;
 *  const query2 = fql`5 + ${query1})`;
 *  // produces
 *  { fql: ["5 + ", { fql: [{ value: { "@int": "17" } }, " + 3"] }] }
 * ```
 */
export type FQLFragment = { fql: (string | QueryInterpolation)[] };

/**
 * All objects returned from Fauna are valid JSON objects.
 */
export type JSONObject = {
  [key: string]: JSONValue;
};

/**
 * All values returned from Fauna are valid JSON values.
 */
export type JSONValue =
  | null
  | string
  | number
  | bigint
  | boolean
  | JSONObject
  | Array<JSONValue>;
