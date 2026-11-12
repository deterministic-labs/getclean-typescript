// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../../index.js";

/**
 * @example
 *     {
 *         link_kinds: ["file"],
 *         section_id: "s3"
 *     }
 */
export interface ListLinksRequest {
    /** Keep only links of these kinds: 1 to 7 of `file`, a file such as a PDF; `page`, another page; `fragment`, a place inside the same page; `mail`, an email address; `phone`, a phone number; `feed`, an RSS or Atom feed; `other`, anything else. An open set, one value per repeated key. Default: every kind. */
    link_kinds?: string | string[] | undefined;
    /** `true` keeps only links that leave the final URL's registrable domain; `false`, only those that stay. Default none, both. A link without a host is left out under either value. */
    external?: boolean | undefined;
    /** Keep only the links of this section and of the sections under it, an `s` id from the map. Default none. */
    section_id?: string | undefined;
    /** Which view's links: `main` or `whole_page`. Default the record's own. */
    scope?: GetClean.Scope | undefined;
    /** At most this many links on a page of results, from 1. Default 50; the maximum, 200, stands in `Limits.bounds`, and a larger value is lowered with the notice `page_size_lowered`. */
    page_size?: number | undefined;
    /** The next page, as the last answer's `next_page_token` gave it; opaque, at most 1,024 characters, alive as long as the record. Default none, the first page. */
    page_token?: string | undefined;
}
