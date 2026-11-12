// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../../index.js";

/**
 * @example
 *     {
 *         page_token: "eyJzIjoic3JjaF80SG0iLCJvIjoyfQ"
 *     }
 */
export interface GetSearchRequest {
    /** How much of the record comes back: `full`, every member, or `compact`, the smaller form the `Search` schema lists. Default `full`. */
    view?: GetClean.View | undefined;
    /** Results per page of the stored list, from 1; the maximum, 50, stands in `Limits.bounds`, and a larger value is lowered with the notice `page_size_lowered`. Default the search's `max_candidates`. */
    page_size?: number | undefined;
    /** The next page of the stored list, as the last answer's `next_page_token` gave it; opaque, at most 1,024 characters, alive as long as the record. Default none, the first page. */
    page_token?: string | undefined;
}
