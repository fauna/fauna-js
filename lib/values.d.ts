/**
 * An Instant represents a fixed point in time (called "exact time"), without
 * regard to calendar or location, e.g. July 20, 1969, at 20:17 UTC.
 *
 * @remarks This class follows the TC39 proposal for `Temporal.Instant`. See the
 * proposal here: https://tc39.es/proposal-temporal/docs/index.html.
 * Since fauna has both `Time` and `Date` data types, we want to make a clear
 * distinction between them and avoid using the native `Date` class.
 */
declare class Instant {
}
/**
 * A Temporal.PlainDate object represents a calendar date that is not associated
 * with a particular time or time zone, e.g. August 24th, 2006.
 *
 * @remarks This class follows the TC39 proposal for `Temporal.Plain`. See the
 * proposal here: https://tc39.es/proposal-temporal/docs/index.html.
 * Since fauna has both `Time` and `Date` data types, we want to make a clear
 * distinction between them and avoid using the native `Date` class.
 */
declare class PlainDate {
}
