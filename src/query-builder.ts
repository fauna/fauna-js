import { TaggedTypeFormat } from "./tagged-type";
import type {
  QueryValueObject,
  QueryValue,
  QueryInterpolation,
  QueryRequest,
  QueryRequestOptions,
} from "./wire-protocol";

/**
 * Creates a new Query. Accepts template literal inputs.
 * @param queryFragments - a {@link TemplateStringsArray} that constitute
 *   the strings that are the basis of the query.
 * @param queryArgs - an Array\<QueryValue\> that
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
  ...queryArgs: QueryValue[]
): Query {
  return new Query(queryFragments, ...queryArgs);
}

/**
 * A builder for composing queries using the {@link fql} tagged template
 * function
 *
 * @internal This class is not intended to be used directly
 */
export class Query {
  readonly queryFragments: ReadonlyArray<string>;
  readonly queryArgs: QueryValue[];

  constructor(
    queryFragments: ReadonlyArray<string>,
    ...queryArgs: QueryValue[]
  ) {
    if (
      queryFragments.length === 0 ||
      queryFragments.length !== queryArgs.length + 1
    ) {
      throw new Error("invalid query constructed");
    }
    this.queryFragments = queryFragments;
    this.queryArgs = queryArgs;
  }

  toString(): string {
    return this.queryFragments
      .map((fragment, i) => {
        // There will always be one more fragment than there are arguments
        if (i === this.queryFragments.length - 1) {
          return fragment === "" ? [] : [fragment];
        }

        const arg = this.queryArgs[i];
        let subQuery: string;
        if (arg instanceof Query) {
          subQuery = arg.toString();
        } else {
          subQuery = JSON.stringify(arg);
        }

        return fragment + subQuery;
      })
      .join("");
  }
}
