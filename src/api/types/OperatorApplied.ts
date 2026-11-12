// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * How one operator was applied on one source.
 */
export interface OperatorApplied {
    /** How it was applied: `native`, `emulated`, `dropped` or `not_applicable`, as `OperatorState` defines them. */
    state: GetClean.OperatorState;
}
