import { QueryValue } from "../wire-protocol";

/**
 * A Fauna Set.
 * @see {@link https://fqlx-beta--fauna-docs.netlify.app/fqlx/beta/reference/language/types#set}
 */
export class Page<T extends QueryValue> {
  /** A materialized page of data */
  readonly data?: T[];
  /**
   * A pagination cursor, used to obtain additional information in the Set.
   * If `after` is not provided, then `data` must be present and represents the
   * last Page in the Set.
   */
  readonly after?: string;

  constructor({
    data,
    after,
  }: { data: T[]; after?: string } | { data?: undefined; after: string }) {
    if (data === undefined && after === undefined) {
      throw new TypeError(
        "Failed to construct a Page. 'data' and 'after' are both undefined"
      );
    }

    this.data = data;
    this.after = after;
  }
}
