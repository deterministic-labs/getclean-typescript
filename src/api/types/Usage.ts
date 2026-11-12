// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * What the account used in one period.
 */
export interface Usage {
    /** When the period starts, RFC 3339 in UTC. */
    starts_at: string;
    /** When the period ends, RFC 3339 in UTC. */
    ends_at: string;
    /** How many of each unit the period used, keyed by unit name; `{}` when nothing was billed. */
    units: Record<string, number>;
    /** What the period's use cost. */
    spent: GetClean.Money;
}
