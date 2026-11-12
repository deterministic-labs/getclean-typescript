// Generated from the getclean API contract; do not edit.

/** How much of a search record comes back: `full`, every member, or `compact`, the smaller form the `Search` schema lists. A closed set. */
export const View = {
    Full: "full",
    Compact: "compact",
} as const;
export type View = (typeof View)[keyof typeof View];
