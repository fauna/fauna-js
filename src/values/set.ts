import { Client } from "../client";
import { Query, fql } from "../query-builder";
import { QueryOptions, QueryValue } from "../wire-protocol";

/**
 * A materialized view of a Set.
 * @see {@link https://fqlx-beta--fauna-docs.netlify.app/fqlx/beta/reference/language/types#set}
 */
export class Page<T extends QueryValue> {
  /** A materialized page of data */
  readonly data: T[];
  /**
   * A pagination cursor, used to obtain additional information in the Set.
   * If `after` is not provided, then `data` must be present and represents the
   * last Page in the Set.
   */
  readonly after?: string;

  constructor({ data, after }: { data: T[]; after?: string }) {
    this.data = data;
    this.after = after;
  }
}

/**
 * A un-materialized Set. Typically received when a materialized Set contains
 * another set, the EmbeddedSet does not contain any data to avoid potential
 * issues such as self-reference and infinite recursion
 * @see {@link https://fqlx-beta--fauna-docs.netlify.app/fqlx/beta/reference/language/types#set}
 */
export class EmbeddedSet {
  /**
   * A pagination cursor, used to obtain additional information in the Set.
   */
  readonly after: string;

  constructor(after: string) {
    this.after = after;
  }
}

/**
 * A class to provide an iterable API for fetching multiple pages of data, given
 * a Fauna Set
 */
export class SetIterator<T extends QueryValue>
  implements AsyncGenerator<T[], void, unknown>
{
  readonly #generator: AsyncGenerator<T[], void, unknown>;

  /**
   * Constructs a new {@link SetIterator}.
   *
   * @remarks Though you can use {@link SetIterator} class directly, it is
   * most common to create an instance through the {@link Client.paginate} `paginate`
   * method.
   *
   * @typeParam T - The expected type of the items returned from Fauna on each
   * iteration
   * @param client - The {@link Client} that will be used to fetch new data on
   * each iteration
   * @param initial - An existing fauna Set ({@link Page} or
   * {@link EmbeddedSet}) or function which returns a promise. If the Promise
   * resolves to a {@link Page} or {@link EmbeddedSet} then the iterator will
   * use the client to fetch additional pages of data.
   * @param options - a {@link QueryOptions} to apply to the queries. Optional.
   */
  constructor(
    client: Client,
    initial: Page<T> | EmbeddedSet | (() => Promise<T | Page<T> | EmbeddedSet>),
    options?: QueryOptions
  ) {
    options = options ?? {};
    if (initial instanceof Function) {
      this.#generator = generateFromThunk(client, initial, options);
    } else if (initial instanceof Page || initial instanceof EmbeddedSet) {
      this.#generator = generatePages(client, initial, options);
    } else {
      throw new TypeError(
        `Expected 'Page<T> | EmbeddedSet | (() => Promise<T | Page<T> | EmbeddedSet>)', but received ${JSON.stringify(
          initial
        )}`
      );
    }
  }

  /**
   * Constructs a new {@link SetIterator} from an {@link Query}
   *
   * @internal Though you can use {@link SetIterator.fromQuery} directly, it is
   * intended as a convenience for use in the {@link Client.paginate} method
   */
  static fromQuery<T extends QueryValue>(
    client: Client,
    query: Query,
    options?: QueryOptions
  ): SetIterator<T> {
    return new SetIterator<T>(
      client,
      async () => {
        const response = await client.query<T | Page<T> | EmbeddedSet>(
          query,
          options
        );
        return response.data;
      },
      options
    );
  }

  /**
   * Constructs a new {@link SetIterator} from an {@link Page} or
   * {@link EmbeddedSet}
   *
   * @internal Though you can use {@link SetIterator.fromPageable} directly, it
   * is intended as a convenience for use in the {@link Client.paginate} method
   */
  static fromPageable<T extends QueryValue>(
    client: Client,
    pageable: Page<T> | EmbeddedSet,
    options?: QueryOptions
  ): SetIterator<T> {
    return new SetIterator<T>(client, pageable, options);
  }

  /**
   * Constructs a new {@link FlattenedSetIterator} from the current instance
   *
   * @returns A new {@link FlattenedSetIterator} from the current instance
   */
  flatten(): FlattenedSetIterator<T> {
    return new FlattenedSetIterator(this);
  }

  /** Implement {@link AsyncGenerator.next} */
  async next(): Promise<IteratorResult<T[], void>> {
    return this.#generator.next();
  }

  /** Implement {@link AsyncGenerator.return} */
  async return(): Promise<IteratorResult<T[], void>> {
    return this.#generator.return();
  }

  /** Implement {@link AsyncGenerator.throw} */
  async throw(e: any): Promise<IteratorResult<T[], void>> {
    return this.#generator.throw(e);
  }

  /** Implement {@link AsyncGenerator} */
  [Symbol.asyncIterator]() {
    return this;
  }
}

/**
 * A class to provide an iterable API for fetching multiple pages of data, given
 * a Fauna Set. This class takes a {@link SetIterator} and flattens the results
 * to yield the items directly.
 */
export class FlattenedSetIterator<T extends QueryValue>
  implements AsyncGenerator<T, void, unknown>
{
  readonly #generator: AsyncGenerator<T, void, unknown>;

  /**
   * Constructs a new {@link FlattenedSetIterator}.
   *
   * @remarks Though you can use {@link FlattenedSetIterator} class directly, it
   * is most common to create an instance through the
   * {@link SetIterator.flatten} method.
   *
   * @typeParam T - The expected type of the items returned from Fauna on each
   * iteration
   * @param setIterator - The {@link SetIterator}
   */
  constructor(setIterator: SetIterator<T>) {
    this.#generator = generateItems(setIterator);
  }

  /** Implement {@link AsyncGenerator.next} */
  async next(): Promise<IteratorResult<T, void>> {
    return this.#generator.next();
  }

  /** Implement {@link AsyncGenerator.return} */
  async return(): Promise<IteratorResult<T, void>> {
    return this.#generator.return();
  }

  /** Implement {@link AsyncGenerator.throw} */
  async throw(e: any): Promise<IteratorResult<T, void>> {
    return this.#generator.throw(e);
  }

  /** Implement {@link AsyncGenerator} */
  [Symbol.asyncIterator]() {
    return this;
  }
}

/**
 * Internal async generator function to use with {@link Page} and
 * {@link EmbeddedSet} values
 */
async function* generatePages<T extends QueryValue>(
  client: Client,
  initial: Page<T> | EmbeddedSet,
  options: QueryOptions
): AsyncGenerator<T[], void, unknown> {
  let currentPage = initial;

  if (currentPage instanceof Page) {
    yield currentPage.data;
  }

  while (currentPage.after) {
    // cursor means there is more data to fetch
    const query = fql`Set.paginate(${currentPage.after})`;
    const response = await client.query<Page<T>>(query, options);
    const nextPage = response.data;

    currentPage = nextPage;
    yield currentPage.data;
  }
}

/**
 * Internal async generator function to use with a function that returns a
 * promise of data. If the promise resolves to a {@link Page} or
 * {@link EmbeddedSet} then continue iterating.
 */
async function* generateFromThunk<T extends QueryValue>(
  client: Client,
  thunk: () => Promise<T | Page<T> | EmbeddedSet>,
  options: QueryOptions
): AsyncGenerator<T[], void, unknown> {
  const result = await thunk();

  if (result instanceof Page || result instanceof EmbeddedSet) {
    for await (const page of generatePages(
      client,
      result as Page<T> | EmbeddedSet,
      options
    )) {
      yield page;
    }
    return;
  }

  yield [result];
}

/**
 * Internal async generator function that flattens a {@link SetIterator}
 */
async function* generateItems<T extends QueryValue>(
  setIterator: SetIterator<T>
) {
  for await (const page of setIterator) {
    for (const item of page) {
      yield item;
    }
  }
}
