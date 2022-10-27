import type {
  JSONValue,
  QueryRequest,
  QueryRequestHeaders,
} from "./wire-protocol";

export interface QueryBuilder {
  toQuery: (
    headers?: QueryRequestHeaders,
    intialArgNumber?: number
  ) => QueryRequest;
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
export function fql(
  queryFragments: TemplateStringsArray,
  ...queryArgs: (JSONValue | QueryBuilder)[]
): QueryBuilder {
  return QueryBuilderImpl.create(queryFragments, ...queryArgs);
}

/**
 * Internal class.
 * A builder for composing queries and QueryRequests.
 */
class QueryBuilderImpl implements QueryBuilder {
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
        queryArgs: QueryBuilderImpl.#buildersFromArgs(
          queryInterpolation.queryArgs
        ),
      };
    } else {
      this.#queryInterpolation = queryInterpolation;
    }
  }

  /**
   * Creates a new QueryBuilderImpl. Accepts template literal inputs.
   * @param queryFragments - a {@link TemplateStringsArray} that constitute
   *   the strings that are the basis of the query.
   * @param queryArgs - an Array\<JSONValue | QueryBuilderImpl\> that
   *   constitute the arguments to inject between the queryFragments.
   * @throws Error - if you call this method directly (not using template
   *   literals) and pass invalid construction parameters
   * @example
   * ```typescript
   *  const str = "baz";
   *  const num = 17;
   *  const innerQueryBuilderImpl = QueryBuilderImpl.create`Math.add(${num}, 3)`;
   *  const queryRequestBuilder = QueryBuilderImpl.create`${str}.length == ${innerQueryBuilderImpl}`;
   * ```
   */
  static create(
    queryFragments: TemplateStringsArray,
    ...queryArgs: (JSONValue | QueryBuilder)[]
  ) {
    return new QueryBuilderImpl({
      queryFragments,
      queryArgs: QueryBuilderImpl.#buildersFromArgs(queryArgs),
    });
  }

  /**
   * Converts this QueryBuilderImpl to a {@link QueryRequest} you can send
   * to Fauna.
   * @param requestHeaders - optional {@link QueryRequestHeaders} to include
   *   in the request (and thus override the defaults in your {@link ClientConfiguration}.
   *   If not passed in, no headers will be set as overrides.
   * @param initialArgNumber - optional number to start the argument names
   *   with. Defaults to zero.
   * @returns a {@link QueryRequest}.
   * @example
   * ```typescript
   *  const str = "baz";
   *  const num = 17;
   *  const innerQueryBuilder = fql`Math.add(${num}, 3)`;
   *  const queryRequestBuilder = fql`${str}.length == ${innerQueryBuilder}`;
   *  const queryRequest: QueryRequest = queryRequestBuilder.toQuery();
   *  // produces:
   *  { query: "arg0.length == Math.add(arg1, 3)", arguments: { arg0: "baz", arg1: 17 }}
   * ```
   */
  toQuery(
    requestHeaders: QueryRequestHeaders = {},
    initialArgNumber = 0
  ): QueryRequest {
    return { ...this.#render(initialArgNumber), ...requestHeaders };
  }

  static #buildersFromArgs(
    queryArgs: (JSONValue | QueryBuilder)[]
  ): QueryBuilder[] {
    return queryArgs.map((queryArg) => {
      if (typeof (<QueryBuilder>queryArg)?.toQuery === "function") {
        return <QueryBuilder>queryArg;
      }
      return new QueryBuilderImpl({ json: <JSONValue>queryArg });
    });
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
        const { query: argQuery, arguments: argArguments } = arg.toQuery(
          {},
          nextArg
        );
        if (argArguments !== undefined) {
          nextArg += Object.keys(argArguments).length;
        }
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

/**
 * A query that can be interpolated.
 * It can be composed of either a set of queryFragments and
 * queryArgs or a plain JSONValue.
 * Note that queryFragments and queryArgs are a javascript
 * artifact that support {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals | template literals}.
 */
type QueryInterpolation =
  | {
      queryFragments: TemplateStringsArray;
      queryArgs: QueryBuilder[];
    }
  | {
      json: JSONValue;
    };
