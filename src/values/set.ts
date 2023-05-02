import { Client } from "../client";
import { fql } from "../query-builder";
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
    initial: Pageable<T> | (() => Promise<QuerySuccess<QueryValue>>)
  ) {
    if (
      !(initial instanceof Function) &&
      !("data" in initial) &&
      (!("after" in initial) || initial.after === undefined)
    ) {
      throw new TypeError(
        "Failed to construct a Page. 'data' and 'after' are both undefined"
      );
    }
    this.#generator = generatePages(client, initial);
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

export type Pageable<T> = { data?: T[]; after?: string };

async function* generatePages<T extends QueryValue>(
  client: Client,
  initial: Pageable<T> | (() => Promise<QuerySuccess<QueryValue>>)
): AsyncGenerator<T[], void, unknown> {
  let currentPage: Pageable<T>;
  if (initial instanceof Function) {
    const initialResponse = await initial();
    if (initialResponse.data instanceof Page) {
      currentPage = initialResponse.data as Page<T>;
    } else {
      currentPage = { data: initialResponse.data } as Pageable<T>;
    }
  } else {
    currentPage = initial;
  }

  if (currentPage.data) {
    yield currentPage.data;
  }

  while (currentPage.after) {
    // cursor means there is more data to fetch
    const response = await client.query<Page<T>>(
      fql`Set.paginate(${currentPage.after})`
    );
    const nextPage = response.data;

    currentPage = nextPage;
    yield nextPage.data;
  }

  return;
}
