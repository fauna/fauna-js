import type { JSONValue, QueryRequest, QueryRequestHeaders } from "./wire-protocol";
export interface QueryBuilder {
    toQuery: (headers?: QueryRequestHeaders, intialArgNumber?: number) => QueryRequest;
}
/**
 * Creates a new QueryBuilder. Accepts template literal inputs.
 * @param queryFragments - a {@link TemplateStringsArray} that constitute
 *   the strings that are the basis of the query.
 * @param queryArgs - an Array\<JSONValue | QueryBuilder\> that
 *   constitute the arguments to inject between the queryFragments.
 * @throws Error - if you call this method directly (not using template
 *   literals) and pass invalid construction parameters
 * @example
 * ```typescript
 *  const str = "baz";
 *  const num = 17;
 *  const innerQueryBuilder = fql`Math.add(${num}, 3)`;
 *  const queryRequestBuilder = fql`${str}.length == ${innerQueryBuilder}`;
 * ```
 */
export declare function fql(queryFragments: TemplateStringsArray, ...queryArgs: (JSONValue | QueryBuilder)[]): QueryBuilder;
