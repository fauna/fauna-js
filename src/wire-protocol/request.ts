import { JSONObject, JSONValue } from ".";
import { fql } from "../query-builder";

/**
 * A request to make to Fauna.
 */
export interface QueryRequest {
  /** The query */
  query: string | QueryInterpolation;

  /** Optional arguments. Variables in the query will be initialized to the
   * value associated with an argument key.
   */
  arguments?: JSONObject;
}

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
