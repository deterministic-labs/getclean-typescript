// Generated from the getclean API contract; do not edit.

/** How a query operator was applied on one source: `native`, by the source; `emulated`, by getclean; `dropped`, left out on that source; `not_applicable`, the query did not use it, or in the catalog an operator the source does not take. A closed set. */
export const OperatorState = {
    Native: "native",
    Emulated: "emulated",
    Dropped: "dropped",
    NotApplicable: "not_applicable",
} as const;
export type OperatorState = (typeof OperatorState)[keyof typeof OperatorState];
