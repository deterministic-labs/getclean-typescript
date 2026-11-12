// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * What `fetch_contents_batch` answers: the tally first, then one result per item in input order, then the sum of the records' costs.
 */
export interface ContentsBatch {
    /** How the items ended, by outcome kind, with the items skipped before any fetch; the six add up to the number of items. */
    counts: GetClean.ContentsBatchCounts;
    /** One result per item, in the order of the request. */
    results: GetClean.ContentsBatchResult[];
    /** The sum of the records' costs, `units` summed by name; `ceiling` is the whole call's. */
    cost: GetClean.Cost;
    /** This call's id, the same as the `Request-Id` header. */
    request_id: string;
}
