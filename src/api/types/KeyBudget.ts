// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * The key's budget over one period.
 */
export interface KeyBudget {
    /** The budget for the period. */
    amount: GetClean.Money;
    /** The budget's period, as the account's billing names it, `month` for example. */
    period: string;
    /** What the period has spent of the budget so far. */
    spent: GetClean.Money;
}
