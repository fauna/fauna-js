/**
 * A request to make to Fauna.
 */
export interface QueryRequest {
  /** The query. */
  query: string;
}

/**
 * A response to a query.
 * @remarks
 * The QueryResponse is type parameterized so that you can treat it as a
 * a certain type if you are using Typescript.
 */
export interface QueryResponse<T> {
  /**
   * The result of the query. The data is any valid JSON value.
   * @remarks
   * data is type parameterized so that you can treat it as a
   * certain type if you are using typescript.
   */
  data: T;
  /** Stats on query performance and cost */
  stats: any;
  /** The last transaction time of the query. An ISO-8601 date string. */
  txn_time: string;
}

/**
 * An error representing a query failure.
 */
export class QueryError extends Error {}
