import type {
  JSONValue,
  QueryRequest,
  QueryRequestHeaders,
} from "./wire-protocol";

/**
 * A query that can be interpolated.
 * It can be composed of either a set of queryFragments and
 * queryArgs or a plain JSONValue.
 * Note that queryFragments and queryArgs are a javascript
 * artifact that support {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals | template literals}.
 */
export type QueryInterpolation =
  | {
      queryFragments: TemplateStringsArray;
      queryArgs: QueryRequestBuilder[];
    }
  | {
      json: JSONValue;
    };

/**
 * A builder for composing QueryRequests from QueryInterpolation objects.
 */
export class QueryRequestBuilder {
  readonly #queryInterpolation: QueryInterpolation;

  private constructor(queryInterpolation: QueryInterpolation) {
    if ("queryFragments" in queryInterpolation) {
      if (
        queryInterpolation.queryFragments.length === 0 ||
        queryInterpolation.queryFragments.length !==
          queryInterpolation.queryArgs.length + 1
      ) {
        throw new Error("invalid query constructed");
      }
      this.#queryInterpolation = {
        ...queryInterpolation,
        queryArgs: QueryRequestBuilder.#queryRequestBuildersFromArgs(
          queryInterpolation.queryArgs
        ),
      };
    } else {
      this.#queryInterpolation = queryInterpolation;
    }
  }

  /**
   * Creates a new QueryRequestBuilder. Accepts template literal inputs.
   * @param queryFragments - a {@link TemplateStringsArray} that constitute
   *   the strings that are the basis of the query.
   * @param queryArgs - an Array\<JSONValue | QueryRequestBuilder\> that
   *   constitute the arguments to inject between the queryFragments.
   * @throws Error - if you call this method directly (not using template
   *   literals) and pass invalid construction parameters
   * @example
   * ```typescript
   *  const str = "baz";
   *  const num = 17;
   *  const innerQueryRequestBuilder = QueryRequestBuilder.newBuilder`Math.add(${num}, 3)`;
   *  const queryRequestBuilder = QueryRequestBuilder.newBuilder`${str}.length == ${innerQueryRequestBuilder}`;
   * ```
   */
  static newBuilder(
    queryFragments: TemplateStringsArray,
    ...queryArgs: (JSONValue | QueryRequestBuilder)[]
  ) {
    return new QueryRequestBuilder({
      queryFragments,
      queryArgs: QueryRequestBuilder.#queryRequestBuildersFromArgs(queryArgs),
    });
  }

  /**
   * Converts this QueryRequestBuilder to a {@link QueryRequest} you can send
   * to Fauna.
   * @param requestHeaders - optional {@link QueryRequestHeaders} to include
   *   in the request (and thus override the defaults in your {@link ClientConfiguration}.
   *   If not passed in, no headers will be set as overrides.
   * @returns a {@link QueryRequest}.
   * @example
   * ```typescript
   *  const str = "baz";
   *  const num = 17;
   *  const innerQueryRequestBuilder = QueryRequestBuilder.newBuilder`Math.add(${num}, 3)`;
   *  const queryRequestBuilder = QueryRequestBuilder.newBuilder`${str}.length == ${innerQueryRequestBuilder}`;
   *  const queryRequest: QueryRequest = queryRequestBuilder.toQueryRequest();
   *  // produces:
   *  { query: "arg0.length == Math.add(arg1, 3)", arguments: { arg0: "baz", arg1: 17 }}
   * ```
   */
  toQueryRequest(requestHeaders: QueryRequestHeaders = {}): QueryRequest {
    return { ...this.#render(), ...requestHeaders };
  }

  static #queryRequestBuildersFromArgs(
    queryArgs: (JSONValue | QueryRequestBuilder)[]
  ): QueryRequestBuilder[] {
    return queryArgs.map((queryArg) =>
      queryArg instanceof QueryRequestBuilder
        ? queryArg
        : new QueryRequestBuilder({ json: queryArg })
    );
  }

  #render(nextArg = 0) {
    if ("queryFragments" in this.#queryInterpolation) {
      const { queryFragments, queryArgs: localArgs } = this.#queryInterpolation;
      const queryFragment = queryFragments[0];
      if (queryFragment === undefined) {
        throw new Error("Internal error!");
      }
      const renderedQuery: string[] = [queryFragment];
      let args: Record<string, JSONValue> = {};
      localArgs.forEach((arg, i) => {
        const { query: argQuery, arguments: argArguments } =
          arg.#render(nextArg);
        nextArg += Object.keys(argArguments).length;
        const queryFragment = queryFragments[i + 1];
        if (queryFragment === undefined) {
          throw new Error("Internal error!");
        }
        renderedQuery.push(argQuery, queryFragment);
        args = { ...args, ...argArguments };
      });
      return { query: renderedQuery.join(""), arguments: args };
    } else {
      const argName = `arg${nextArg}`;
      const args: { [x: string]: any } = {};
      args[argName] = this.#queryInterpolation.json;
      return {
        query: `${argName}`,
        arguments: args,
      };
    }
  }
}
