/**
 * Matches the subset of ISO8601 dates that Fauna can accept. Cannot include any
 * time part
 */
export declare const plaindate: RegExp;
/**
 * Matches a valid ISO8601 date and can have anything trailing after.
 */
export declare const startsWithPlaindate: RegExp;
/**
 * Matches the subset of ISO8601 times that Fauna can accept.
 */
export declare const datetime: RegExp;
