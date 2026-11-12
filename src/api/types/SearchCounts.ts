// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * The counts describe the search, never a page; `found` equals `returned` plus every dropped count whatever ended the list.
 */
export interface SearchCounts {
    /** The leads returned. */
    returned: number;
    /** The pages found before the cut. */
    found: number;
    /** Why the rest are not leads, by reason. */
    dropped: GetClean.DroppedCounts;
}
