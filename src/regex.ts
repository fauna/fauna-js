// Date and Time expressions

const yearpart = /(?:\d{4}|[\u2212-]\d{4,}|\+\d{5,})/;
const monthpart = /(?:0[1-9]|1[0-2])/;
const daypart = /(?:0[1-9]|[12]\d|3[01])/;
const hourpart = /(?:[01][0-9]|2[0-3])/;
const minsecpart = /(?:[0-5][0-9])/;
const decimalpart = /(?:\.\d+)/;

const datesplit = new RegExp(
  `(${yearpart.source}-(${monthpart.source})-(${daypart.source}))`
);

const timesplit = new RegExp(
  `(${hourpart.source}:${minsecpart.source}:${minsecpart.source}${decimalpart.source}?)`
);

const zonesplit = new RegExp(
  `([zZ]|[+\u2212-]${hourpart.source}(?::?${minsecpart.source}|:${minsecpart.source}:${minsecpart.source}))`
);

/**
 * Matches the subset of ISO8601 dates that Fauna can accept. Cannot include any
 * time part
 */
export const plaindate = new RegExp(`^${datesplit.source}$`);

/**
 * Matches a valid ISO8601 date and can have anything trailing after.
 */
export const startsWithPlaindate = new RegExp(`^${datesplit.source}`);

/**
 * Matches the subset of ISO8601 times that Fauna can accept.
 */
export const datetime = new RegExp(
  `^${datesplit.source}T${timesplit.source}${zonesplit.source}$`
);
