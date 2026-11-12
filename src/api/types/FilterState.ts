// Generated from the getclean API contract; do not edit.

/** How a hard filter was applied on one source; `native`, by the source; `emulated`, by getclean after the fact; `skipped`, the source skipped for it; `not_applicable`, the filter not sent, or in the catalog a filter the source does not take. A closed set. */
export const FilterState = {
    Native: "native",
    Emulated: "emulated",
    Skipped: "skipped",
    NotApplicable: "not_applicable",
} as const;
export type FilterState = (typeof FilterState)[keyof typeof FilterState];
