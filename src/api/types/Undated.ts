// Generated from the getclean API contract; do not edit.

/** Whether pages with no detectable date are kept inside a date window: `shown` keeps them, `hidden` drops them. A closed set. */
export const Undated = {
    Shown: "shown",
    Hidden: "hidden",
} as const;
export type Undated = (typeof Undated)[keyof typeof Undated];
