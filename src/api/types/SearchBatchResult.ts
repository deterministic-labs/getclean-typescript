// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * One item's result: its search record, or the problem that skipped it, exactly one of the two present.
 */
export interface SearchBatchResult {
    /** The item's position in the request, from 0. */
    index: number;
    /** Your label for the item, as sent. Present when given. */
    label?: string | undefined;
    /** The search record, with the batch call's `request_id`, its `applied_request` the item's fields merged with the top's, and its own `expires_at`. Present when the item ran. */
    search?: GetClean.Search | undefined;
    /** Why the item was skipped, without `status`, its `instance` ending in `/items/<index>`. Present when the item was skipped. */
    problem?: GetClean.Problem | undefined;
}
