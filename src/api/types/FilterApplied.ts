// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * How one hard filter was applied on one source.
 */
export interface FilterApplied {
    /** How it was applied: `native`, `emulated`, `skipped` or `not_applicable`, as `FilterState` defines them. */
    state: GetClean.FilterState;
    /** How getclean emulated it. Present on `emulated`. */
    how?: string | undefined;
}
