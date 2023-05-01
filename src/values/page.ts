import { Client } from "../client";
import { fql } from "../query-builder";
import { QueryValue } from "../wire-protocol";

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
  implements AsyncGenerator<Page<T>, void, unknown>
{
  readonly #generator: AsyncGenerator<Page<T>, void, unknown>;
  #currentData?: T[];
  #currentAfter?: string;

  constructor(client: Client, initial: Page<T> | EmbeddedSet) {
    this.#generator = generatePages(client, initial);
    this.#currentAfter = initial.after;
  }

  static fromPage<T extends QueryValue>(
    client: Client,
    initial: Page<T>
  ): SetIterator<T> {
    const iter = new SetIterator<T>(client, initial);
    iter.#currentData = initial.data;
    return iter;
  }

  /** A materialized page of data */
  get data() {
    return this.#currentData;
  }

  /**
   * A pagination cursor, used to obtain additional information in the Set.
   * If `after` is not provided, then `data` must be present and represents the
   * last Page in the Set.
   */
  get after() {
    return this.#currentAfter;
  }

  async next(): Promise<IteratorResult<Page<T>, void>> {
    const next = await this.#generator.next();
    if (next.value) {
      this.#currentData = next.value.data;
      this.#currentAfter = next.value.after;
    }
    return next;
  }

  async return(): Promise<IteratorResult<Page<T>, void>> {
    return this.#generator.return();
  }

  async throw(e: any): Promise<IteratorResult<Page<T>, void>> {
    return this.#generator.throw(e);
  }

  [Symbol.asyncIterator]() {
    return this;
  }
}

async function* generatePages<T extends QueryValue>(
  client: Client,
  initial: Page<T> | EmbeddedSet
): AsyncGenerator<Page<T>, void, unknown> {
  let currentPage = initial;

  if ("data" in initial) {
    yield new Page(initial);
  }

  while (currentPage.after) {
    // cursor means there is more data to fetch
    const response = await client.query<Page<T>>(
      // project for data and after cursors so we don't have issues with
      // recursive Page instances
      fql`Set.paginate(${currentPage.after}) { data, after }`
    );
    const nextPage = response.data;

    currentPage = nextPage;
    yield new Page(nextPage);
  }

  return;
}
