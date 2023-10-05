import { TaggedTypeFormat } from "./tagged-type";
import type {
  QueryValueObject,
  QueryValue,
  QueryInterpolation,
  QueryRequest,
  QueryOptions,
} from "./wire-protocol";

/**
 * Creates a new Query. Accepts template literal inputs.
 * @param queryFragments - a {@link TemplateStringsArray} that constitute
 *   the strings that are the basis of the query.
 * @param queryArgs - an Array\<QueryValue | Query\> that
 *   constitute the arguments to inject between the queryFragments.
 * @throws Error - if you call this method directly (not using template
 *   literals) and pass invalid construction parameters
 * @example
 * ```typescript
 *  const str = "baz";
 *  const num = 17;
 *  const innerQuery = fql`${num} + 3)`;
 *  const queryRequestBuilder = fql`${str}.length == ${innerQuery}`;
 * ```
 */
export function fql(
  queryFragments: ReadonlyArray<string>,
  ...queryArgs: (QueryValue | Query)[]
): Query {
  return new Query(queryFragments, ...queryArgs);
}

/**
 * Internal class.
 * A builder for composing queries using the {@link fql} tagged template
 * function
 */
export class Query {
  readonly #queryFragments: ReadonlyArray<string>;
  readonly #queryArgs: (QueryValue | Query)[];

  constructor(
    queryFragments: ReadonlyArray<string>,
    ...queryArgs: (QueryValue | Query)[]
  ) {
    if (
      queryFragments.length === 0 ||
      queryFragments.length !== queryArgs.length + 1
    ) {
      throw new Error("invalid query constructed");
    }
    this.#queryFragments = queryFragments;
    this.#queryArgs = queryArgs;
  }

  /**
   * Converts this Query to a {@link QueryRequest} you can send
   * to Fauna.
   * @param requestHeaders - optional {@link QueryOptions} to include
   *   in the request (and thus override the defaults in your {@link ClientConfiguration}.
   *   If not passed in, no headers will be set as overrides.
   * @returns a {@link QueryRequest}.
   * @example
   * ```typescript
   *  const num = 8;
   *  const queryBuilder = fql`'foo'.length == ${num}`;
   *  const queryRequest = queryBuilder.toQuery();
   *  // produces:
   *  { query: { fql: ["'foo'.length == ", { value: { "@int": "8" } }, ""] }}
   * ```
   */
  toQuery(requestHeaders: QueryOptions = {}): QueryRequest {
    return { ...this.#render(requestHeaders), ...requestHeaders };
  }

  #render(requestHeaders: QueryOptions): QueryRequest {
    if (this.#queryFragments.length === 1) {
      return { query: { fql: [this.#queryFragments[0]] }, arguments: {} };
    }

    let resultArgs: QueryValueObject = {};
    const renderedFragments: (string | QueryInterpolation)[] =
      this.#queryFragments.flatMap((fragment, i) => {
        // There will always be one more fragment than there are arguments
        if (i === this.#queryFragments.length - 1) {
          return fragment === "" ? [] : [fragment];
        }

        const arg = this.#queryArgs[i];
        let subQuery: string | QueryInterpolation;
        if (arg instanceof Query) {
          const request = arg.toQuery(requestHeaders);
          subQuery = request.query;
          resultArgs = { ...resultArgs, ...request.arguments };
        } else {
          // arguments in the template format must always be encoded, regardless
          // of the "x-format" request header
          // TODO: catch and rethrow Errors, indicating bad user input
          subQuery = { value: TaggedTypeFormat.encode(arg) };
        }

        return [fragment, subQuery].filter((x) => x !== "");
      });

    return {
      query: { fql: renderedFragments },
      arguments: resultArgs,
    };
  }
}
