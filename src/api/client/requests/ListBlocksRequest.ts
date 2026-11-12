// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../../index.js";

/**
 * @example
 *     {
 *         block_kinds: ["table"],
 *         section_id: "s2",
 *         block_ids: ["b7"]
 *     }
 */
export interface ListBlocksRequest {
    /** Keep only blocks of these kinds: 1 to 10 of `text`, `heading`, `code`, `math`, `divider`, `interactive`, `table`, `image`, `embed`, `media`, an open set, one value per repeated key. Default: every kind. */
    block_kinds?: string | string[] | undefined;
    /** Keep only the blocks of this section and of the sections under it, an `s` id from the map. Default none. */
    section_id?: string | undefined;
    /** Keep only the blocks of this page of a document, from 1 to `pages.count`. Default none. On a record without `pages`, a web page, it is refused `dependent`; above `pages.count`, `bound`. */
    page_number?: number | undefined;
    /** Keep only these blocks, 1 to 50 `b` ids, one value per repeated key; the ids a highlight names. Default none. With `start_block_id` it is refused `exclusive`. */
    block_ids?: string | string[] | undefined;
    /** Begin the page of results at this block, a `b` id, and read on from there in document order. Default none, the first block. With `block_ids` it is refused `exclusive`. */
    start_block_id?: string | undefined;
    /** Which view's blocks: `main` or `whole_page`. Default the record's own. */
    scope?: GetClean.Scope | undefined;
    /** The most text on one page of results, in characters; the page ends before the block that would pass it. Default 20,000; 1,000 to 1,000,000. */
    max_characters?: number | undefined;
    /** At most this many blocks on a page of results, from 1. Default 50; the maximum, 200, stands in `Limits.bounds`, and a larger value is lowered with the notice `page_size_lowered`. */
    page_size?: number | undefined;
    /** The next page, as the last answer's `next_page_token` gave it; opaque, at most 1,024 characters, alive as long as the record. Default none, the first page. */
    page_token?: string | undefined;
}
