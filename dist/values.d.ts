/**
 * An wrapper around the Fauna `Time` type. It, represents a fixed point in time
 * without regard to calendar or location, e.g. July 20, 1969, at 20:17 UTC.
 * Convert to and from Javascript Date's with the {@link TimeStub.fromDate} and
 * {@link TimeStub.toDate} methods.
 * See remarks for possible precision loss when doing this. If precision loss is
 * a concern consider using a 3rd party datetime library such as luxon.
 *
 * @remarks The Javascript `Date` type most closely resembles a Fauna `Time`,
 * not a Fauna `Date`. However, Fauna stores `Time` values with nanosecond
 * precision, while Javascript `Date` values only have millisecond precision.
 * This TimeStub class preserves precision by storing the original string value
 * and should be used whenever possible to pass `Time` values back to Fauna.
 * Converting to a Javascript date before sending to Fauna could result in loss
 * of precision.
 *
 * @see {@link https://deploy-preview-1272--fauna-docs.netlify.app/fqlx/beta/reference/builtin_functions/time/time}
 */
export declare class TimeStub {
    readonly isoString: string;
    /**
     * @remarks constructor is private to enforce using factory functions
     */
    private constructor();
    /**
     * Creates a new {@link TimeStub} from an ISO date string
     * @param isoString - An ISO date string.
     * @returns A new {@link TimeStub}
     * @throws TypeError if a string is not provided, or RangeError if item
     * is not a valid date
     */
    static from(isoString: string): TimeStub;
    /**
     * Creates a new {@link TimeStub} from a Javascript `Date`
     * @param date - A Javascript `Date`
     * @returns A new {@link TimeStub}
     */
    static fromDate(date: Date): TimeStub;
    /**
     * Get a copy of the `TimeStub` converted to a Javascript `Date`. Does not
     * mutate the existing `TimeStub` value.
     * @returns A `Date`
     */
    toDate(): Date;
    /**
     * Override default string conversion
     * @returns the string representation of a `TimeStub`
     */
    toString(): string;
}
/**
 * A wrapper aroud the Fauna `Date` type. It represents a calendar date that is
 * not associated with a particular time or time zone, e.g. August 24th, 2006.
 * Convert to and from Javascript Date's with the {@link DateStub.fromDate} and
 * {@link DateStub.toDate} methods. Javascript Dates are rendered in UTC time
 * before the date part is used.
 * See remarks for possible precision loss when doing this. If precision loss is
 * a concern consider using a 3rd party datetime library such as luxon.
 *
 * @remarks The Javascript `Date` type always has a time associated with it, but
 * Fauna's `Date` type does not. When converting from a Fauna `Date` to a
 * Javascript `Date`, we set time to 00:00:00 UTC. When converting a Javascript
 * `Date` or time string to Fauna `Date`, we convert to UTC first. Care should
 * be taken to specify the desired date, since Javascript `Date`s use local
 * timezone info by default.
 *
 * @see {@link https://deploy-preview-1272--fauna-docs.netlify.app/fqlx/beta/reference/builtin_functions/date/date}
 */
export declare class DateStub {
    readonly dateString: string;
    /**
     * @remarks constructor is private to enforce using factory functions
     */
    private constructor();
    /**
     * Creates a new {@link DateStub} from a date string
     * @param dateString - A plain date string. The time is converted to UTC
     * before saving the date.
     * @returns A new {@link DateStub}
     * @throws TypeError if a string is not provided, or RangeError if dateString
     * is not a valid date
     */
    static from(dateString: string): DateStub;
    /**
     * Creates a new {@link DateStub} from a Javascript `Date`
     * @param date - A Javascript `Date`. The time is converted to UTC before
     * saving the date.
     * @returns A new {@link DateStub}
     */
    static fromDate(date: Date): DateStub;
    /**
     * Get a copy of the `TimeStub` converted to a Javascript `Date`. Does not
     * mutate the existing `TimeStub` value.
     * @returns A `Date`
     */
    toDate(): Date;
    /**
     * Override default string conversion
     * @returns the string representation of a `DateStub`
     */
    toString(): string;
}
