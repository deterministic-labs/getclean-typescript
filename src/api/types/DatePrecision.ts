// Generated from the getclean API contract; do not edit.

/** How exact a published date is; `day`, `month` or `year`. A closed set. */
export const DatePrecision = {
    Day: "day",
    Month: "month",
    Year: "year",
} as const;
export type DatePrecision = (typeof DatePrecision)[keyof typeof DatePrecision];
