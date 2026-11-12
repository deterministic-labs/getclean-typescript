// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * One item's result: its record, or the problem that skipped it; exactly one of the two is present.
 */
export interface ContentsBatchResult {
    /** The item's position in the request, from 0. */
    index: number;
    /** Your label for the item, as sent. Present when given. */
    label?: string | undefined;
    /** The record, with the members its outcome carries and its own `cost`. Present when the item was fetched. */
    contents?: GetClean.Contents | undefined;
    /** Why the item was skipped, without `status`, its `instance` ending in `/items/<index>`. Present when the item was skipped. */
    problem?: GetClean.Problem | undefined;
}
