import { TaggedTypeFormat } from "./tagged-type";
import type {
  FQLFragment,
  QueryValue,
  QueryInterpolation,
} from "./wire-protocol";

/**
 * A QueryArgumentObject is a plain javascript object where each property is a
 * valid QueryArgument.
 */
export type QueryArgumentObject = {
  [key: string]: QueryArgument;
};

/**
 * A QueryArgument represents all possible values that can be encoded and passed
 * to Fauna as a query argument.
 *
 * The {@link fql} tagged template function requires all arguments to be of type
 * QueryArgument.
 */
export type QueryArgument =
  | QueryValue
  | Query<any>
  | Date
  | ArrayBuffer
  | Uint8Array
  | Array<QueryArgument>
  | QueryArgumentObject;

/**
 * Creates a new Query. Accepts template literal inputs.
 * @typeParam T - The expected type of the response from Fauna when evaluated.
 * @param queryFragments - An array that constitutes
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
export function fql<T extends QueryValue = any>(
  queryFragments: ReadonlyArray<string>,
  ...queryArgs: QueryArgument[]
): Query<T> {
  return new Query<T>(queryFragments, ...queryArgs);
}

/**
 * Internal class.
 * A builder for composing queries using the {@link fql} tagged template
 * function
 * @typeParam T - The expected type of the response from Fauna when evaluated.
 *   T can be used to infer the type of the response type from {@link Client}
 *   methods.
 */
export class Query<T extends QueryValue = any> {
  readonly #queryFragments: ReadonlyArray<string>;
  readonly #interpolatedArgs: QueryArgument[];
  /**
   * A phantom field to enforce the type of the Query.
   * @internal
   *
   * We need to provide an actual property of type `T` for Typescript to
   * actually enforce it.
   *
   * "Because TypeScript is a structural type system, type parameters only
   * affect the resulting type when consumed as part of the type of a member."
   *
   * @see {@link https://www.typescriptlang.org/docs/handbook/type-compatibility.html#generics}
   */
  readonly #__phantom: T;

  constructor(
    queryFragments: ReadonlyArray<string>,
    ...queryArgs: QueryArgument[]
  ) {
    if (
      queryFragments.length === 0 ||
      queryFragments.length !== queryArgs.length + 1
    ) {
      throw new Error("invalid query constructed");
    }
    this.#queryFragments = queryFragments;
    this.#interpolatedArgs = queryArgs;

    // HACK: We have to construct the phantom field, but we don't have any value for it.
    this.#__phantom = undefined as unknown as T;
  }

  /**
   * Converts this Query to an {@link FQLFragment} you can send
   * to Fauna.
   * @returns a {@link FQLFragment}.
   * @example
   * ```typescript
   *  const num = 8;
   *  const queryBuilder = fql`'foo'.length == ${num}`;
   *  const queryRequest = queryBuilder.toQuery();
   *  // produces:
   *  { fql: ["'foo'.length == ", { value: { "@int": "8" } }, ""] }
   * ```
   */
  encode(): FQLFragment {
    if (this.#queryFragments.length === 1) {
      return { fql: [this.#queryFragments[0]] };
    }

    let renderedFragments: (string | QueryInterpolation)[] =
      this.#queryFragments.flatMap((fragment, i) => {
        // There will always be one more fragment than there are arguments
        if (i === this.#queryFragments.length - 1) {
          return fragment === "" ? [] : [fragment];
        }

        // arguments in the template format must always be encoded, regardless
        // of the "x-format" request header
        // TODO: catch and rethrow Errors, indicating bad user input
        const arg = this.#interpolatedArgs[i];
        const encoded = TaggedTypeFormat.encodeInterpolation(arg);

        return [fragment, encoded];
      });

    // We don't need to send empty-string fragments over the wire
    renderedFragments = renderedFragments.filter((x) => x !== "");

    return { fql: renderedFragments };
  }
}
