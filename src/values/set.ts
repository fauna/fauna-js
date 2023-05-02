import { Client } from "../client";
import { Query, fql } from "../query-builder";
import { QuerySuccess, QueryValue } from "../wire-protocol";

/**
 * A materialize view of a Set.
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
 * A un-materialize Set. Typically received when a materialized Set contains
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

  constructor(
    client: Client,
    initial: Page<T> | EmbeddedSet | (() => Promise<T>)
  ) {
    if (initial instanceof Function) {
      this.#generator = generateFromThunk(client, initial);
    } else if (initial instanceof Page || initial instanceof EmbeddedSet) {
      this.#generator = generatePages(client, initial);
    } else {
      throw new TypeError(
        "Expected 'Pageable<QueryValue> | (() => Promise<T>)', but received " +
          // @ts-expect-error "Property 'constructor' does not exist on type 'never'."
          // This is okay, we still want to catch weird inputs from JS
          initial.constructor.name +
          " " +
          JSON.stringify(initial)
      );
    }
  }

  static fromQuery<T extends QueryValue>(
    client: Client,
    query: Query
  ): SetIterator<T> {
    return new SetIterator<T>(client, async () => {
      const response = await client.query<T>(query);
      return response.data;
    });
  }

  static fromPageable<T extends QueryValue>(
    client: Client,
    pageable: Page<T> | EmbeddedSet
  ): SetIterator<T> {
    return new SetIterator<T>(client, pageable);
  }

  flatten(): FlattenedSetIterator<T> {
    return new FlattenedSetIterator(this);
  }

  async next(): Promise<IteratorResult<T[], void>> {
    return this.#generator.next();
  }

  async return(): Promise<IteratorResult<T[], void>> {
    return this.#generator.return();
  }

  async throw(e: any): Promise<IteratorResult<T[], void>> {
    return this.#generator.throw(e);
  }

  [Symbol.asyncIterator]() {
    return this;
  }
}

export class FlattenedSetIterator<T extends QueryValue>
  implements AsyncGenerator<T, void, unknown>
{
  readonly #generator: AsyncGenerator<T, void, unknown>;

  constructor(setIterator: SetIterator<T>) {
    async function* generateItems<T extends QueryValue>(
      setIterator: SetIterator<T>
    ) {
      for await (const page of setIterator) {
        for (const item of page) {
          yield item;
        }
      }
    }

    this.#generator = generateItems(setIterator);
  }

  async next(): Promise<IteratorResult<T, void>> {
    return this.#generator.next();
  }

  async return(): Promise<IteratorResult<T, void>> {
    return this.#generator.return();
  }

  async throw(e: any): Promise<IteratorResult<T, void>> {
    return this.#generator.throw(e);
  }

  [Symbol.asyncIterator]() {
    return this;
  }
}

async function* generatePages<T extends QueryValue>(
  client: Client,
  initial: Page<T> | EmbeddedSet
): AsyncGenerator<T[], void, unknown> {
  let currentPage = initial;

  if (currentPage instanceof Page) {
    yield currentPage.data;
  }

  while (currentPage.after) {
    // cursor means there is more data to fetch
    const response = await client.query<Page<T>>(
      fql`Set.paginate(${currentPage.after})`
    );
    const nextPage = response.data;

    currentPage = nextPage;
    yield currentPage.data;
  }
}

async function* generateFromThunk<T extends QueryValue>(
  client: Client,
  thunk: () => Promise<T>
): AsyncGenerator<T[], void, unknown> {
  const result = await thunk();

  if (result instanceof Page || result instanceof EmbeddedSet) {
    for await (const page of generatePages(client, result)) {
      yield page;
    }
    return;
  }

  yield [result];
}
