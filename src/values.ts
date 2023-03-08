/**
 * An wrapper around the Fauna `Time` type. It, represents a fixed point in time
 * without regard to calendar or location, e.g. July 20, 1969, at 20:17 UTC.
 *
 * @remarks The Javascript `Date` type most closely resembles a Fauna `Time`,
 * not a Fauna `Date`. However, Fauna stores `Time` values with nanosecond
 * precision, while Javascript `Date` values only have millisecond precision.
 * This FaunaTime class preserves precision by storing the original string value
 * and should be used whenever possible to pass `Time` values back to Fauna.
 * Converting to a Javascript date before sending to Fauna could result in loss
 * of precision.
 *
 * TODO: link to beta docs for `Time` type
 */
export class FaunaTime {
  readonly #value: string;

  /**
   * @remarks constructor is private to enforce using factory functions
   */
  private constructor(isoString: string) {
    this.#value = isoString;
  }

  /**
   * Creates a new {@link FaunaTime} from an ISO date string
   * @param item - An ISO date string.
   * @returns A new {@link FaunaTime}
   * @throws TypeError if a string is not provided, or RangeError if item
   * is not a valid date
   */
  static from(item: string): FaunaTime {
    if (typeof item !== "string") {
      throw new TypeError(
        `Expected string but received ${typeof item}: ${item}`
      );
    }
    const validatedDate = new Date(item);
    if (validatedDate.toString() === "Invalid Date") {
      throw new RangeError(
        `Expected a valid date string but received '${item}'`
      );
    }

    return new FaunaTime(item);
  }

  /**
   * Creates a new {@link FaunaTime} from a Javascript `Date`
   * @param isoString - A Javascript `Date`
   * @returns A new {@link FaunaTime}
   */
  static fromDate(date: Date): FaunaTime {
    return new FaunaTime(date.toISOString());
  }

  /**
   * Get the underlying string value
   */
  get value(): string {
    return this.#value;
  }

  /**
   * Get a copy of the `FaunaTime` converted to a Javascript `Date`. Does not
   * mutate the existing `FaunaTime` value.
   * @returns A `Date`
   */
  toDate(): Date {
    return new Date(this.#value);
  }

  /**
   * Override default JSON output
   * @returns the string representation of the Fauna Time
   */
  toJSON(): string {
    return this.#value;
  }
}

/**
 * A wrapper aroud the Fauna `Date` type. It represents a calendar date that is
 * not associated with a particular time or time zone, e.g. August 24th, 2006.
 *
 * @remarks The Javascript `Date` type always has a time associated with it, but
 * Fauna's `Date` type does not. When converting from a Fauna `Date` to a
 * Javascript `Date`, we set time to 00:00:00 UTC. When converting a Javascript
 * `Date` or time string to Fauna `Date`, we convert to UTC first. Care should
 * be taken to specify the desired date, since Javascript `Date`s use local
 * timezone info by default.
 *
 * TODO: link to beta docs for `Date` type
 */
export class FaunaDate {
  readonly #value: string;

  /**
   * @remarks constructor is private to enforce using factory functions
   */
  private constructor(dateString: string) {
    this.#value = dateString;
  }

  /**
   * Creates a new {@link FaunaDate} from a date string
   * @param item - A date string. The time is converted to UTC before saving the
   * date.
   * @returns A new {@link FaunaDate}
   * @throws TypeError if a string is not provided, or RangeError if item
   * is not a valid date
   */
  static from(item: string): FaunaDate {
    if (typeof item !== "string") {
      throw new TypeError(
        `Expected string but received ${typeof item}: ${item}`
      );
    }
    const validatedDate = new Date(item);
    if (validatedDate.toString() === "Invalid Date") {
      throw new RangeError(
        `Expected a valid date string but received '${item}'`
      );
    }

    return new FaunaDate(validatedDate.toISOString().slice(0, 10));
  }

  /**
   * Creates a new {@link FaunaDate} from a Javascript `Date`
   * @param isoString - A Javascript `Date`. The time is converted to UTC before
   * saving the date.
   * @returns A new {@link FaunaDate}
   */
  static fromDate(date: Date): FaunaDate {
    if (!(date instanceof Date)) {
      throw new TypeError(`Expected Date but received ${typeof date}: ${date}`);
    }

    return new FaunaDate(date.toISOString().slice(0, 10));
  }

  /**
   * Get the underlying string value
   */
  get value(): string {
    return this.#value;
  }

  /**
   * Get a copy of the `FaunaTime` converted to a Javascript `Date`. Does not
   * mutate the existing `FaunaTime` value.
   * @returns A `Date`
   */
  toDate(): Date {
    return new Date(this.#value + "T00:00:00Z");
  }

  /**
   * Override default JSON output
   * @returns the string representation of the Fauna Time
   */
  toJSON(): string {
    return this.#value;
  }
}
