import { Client } from "../client";
import { fql } from "../query-builder";
import { QueryValue } from "../wire-protocol";

/**
 * A materialize view of a Set.
 * @see {@link https://fqlx-beta--fauna-docs.netlify.app/fqlx/beta/reference/language/types#set}
 */
export class Page<T extends QueryValue> implements PageObject<T> {
  /** A materialized page of data */
  readonly data: T[];
  /**
   * A pagination cursor, used to obtain additional information in the Set.
   * If `after` is not provided, then `data` must be present and represents the
   * last Page in the Set.
   */
  readonly after?: string;

  constructor({ data, after }: PageObject<T>) {
    this.data = data;
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

  constructor(client: Client, initial: PageObject<T> | EmbeddedSetObject) {
    if (!("data" in initial) && initial.after === undefined) {
      throw new TypeError(
        "Failed to construct a Page. 'data' and 'after' are both undefined"
      );
    }
    this.#generator = generatePages(client, initial);
    if ("data" in initial) this.#currentData = initial.data;
    this.#currentAfter = initial.after;
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

type PageObject<T> = { data: T[]; after?: string };
type EmbeddedSetObject = { after: string };

async function* generatePages<T extends QueryValue>(
  client: Client,
  initial: PageObject<T> | EmbeddedSetObject
): AsyncGenerator<Page<T>, void, unknown> {
  let currentPage = initial;

  if ("data" in initial) {
    yield new Page(initial);
  }

  while (currentPage.after) {
    // cursor means there is more data to fetch
    const response = await client.query<PageObject<T>>(
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
