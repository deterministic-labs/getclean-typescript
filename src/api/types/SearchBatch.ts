// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * The answer of `search_batch`: the tally first, then one result per item in input order, then the sum of the searches' costs.
 */
export interface SearchBatch {
    /** How the items ended, by outcome kind, with the items skipped before any search; the six add up to the number of items. */
    counts: GetClean.SearchBatchCounts;
    /** One result per item, in input order. */
    results: GetClean.SearchBatchResult[];
    /** The sum of the searches' costs, `units` summed by name; `ceiling` the whole call's. */
    cost: GetClean.Cost;
    /** This call's id, the same as the `Request-Id` header. */
    request_id: string;
}
