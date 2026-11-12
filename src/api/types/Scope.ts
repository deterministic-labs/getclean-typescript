// Generated from the getclean API contract; do not edit.

/** Which view of a page is meant: `main`, the main content alone, or `whole_page`, everything on the page. A closed set. */
export const Scope = {
    Main: "main",
    WholePage: "whole_page",
} as const;
export type Scope = (typeof Scope)[keyof typeof Scope];
