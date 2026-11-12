// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * The key's cap on one call and its budgets.
 */
export interface Caps {
    /** The most one call may cost under this key; it is the default `max_cost`. */
    call_cap: GetClean.Money;
    /** What is left of the default run's budget. Present when the run has one. */
    run_budget?: GetClean.Money | undefined;
    /** The key's budget over a period. Present when the account owner set one. */
    key_budget?: GetClean.KeyBudget | undefined;
}
