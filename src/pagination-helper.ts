import { Client } from "./client";
import { fql } from "./query-builder";
import { Page, PageObject } from "./values";
import { QueryValue } from "./wire-protocol";

export class PaginationHelper<T extends QueryValue>
  implements AsyncGenerator<T[], undefined, unknown>
{
  readonly #client: Client;
  #pages: Page<T>[];
  #iter: number;

  constructor(client: Client, pages: Page<T>[]) {
    this.#client = client;
    this.#pages = pages;
    this.#iter = -1;
  }

  hasNext(): boolean {
    return (
      this.#pages.length > 0 &&
      (this.#iter < this.#pages.length - 1 || !!this.#pages[this.#iter].after)
    );
  }

  hasPrevious(): boolean {
    return this.#iter > 0;
  }

  async next(): Promise<IteratorResult<T[], undefined>> {
    if (!this.hasNext()) {
      return { done: true, value: undefined };
    }

    this.#iter++;

    if (this.#iter < this.#pages.length) {
      if (this.#pages[this.#iter].data) {
        // Most common: we will almost always have data here
        const data = this.#pages[this.#iter].data as T[];
        return { done: false, value: data };
      } else {
        // Uncommon: If there is no data then it's an embedded set and we need to materialize it.
        // TODO: handle embedded sets
      }
    } else if (this.#iter === this.#pages.length) {
      const cursor = this.#pages[this.#iter - 1].after;
      if (!cursor) {
        // no cursor means the previous page was the last page
        return { done: true, value: undefined };
      }
      // cursor means there is more data to fetch
      const response = await this.#client.query<Page<T> | PageObject<T>>(
        fql`Set.paginate(${cursor})`
      );
      let nextPage = response.data;
      // Core doesn't return `@set` tagged values for `Set.paginate()` calls,
      // yet, so we have to check if the result is decoded into a Page. If not,
      // then we have a PageObject and should construct a Page with it. This
      // won't be necessary once core is updated.
      if (!(nextPage instanceof Page)) {
        nextPage = new Page(nextPage);
      }
      this.#pages.push(nextPage);
      if (nextPage.data) {
        return {
          done: false,
          value: nextPage.data,
        };
      } else {
        // unreachable since we just queried `Set.paginate()`
      }
    }

    return { done: true, value: undefined };
  }

  async previous(): Promise<IteratorResult<T[], undefined>> {
    if (!this.hasPrevious()) {
      return { done: true, value: undefined };
    }

    this.#iter--;

    // Can assume there is data here, since we must have called `next` before,
    // and that means that data has been materialized for that page.
    const data = this.#pages[this.#iter].data as T[];
    return { done: false, value: data };
  }

  async return(): Promise<IteratorResult<T[], undefined>> {
    return { done: true, value: undefined };
  }

  async throw(e: Error): Promise<IteratorResult<T[], undefined>> {
    throw e;
  }

  [Symbol.asyncIterator]() {
    return this;
  }
}
