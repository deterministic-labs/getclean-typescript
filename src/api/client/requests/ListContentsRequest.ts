// Generated from the getclean API contract; do not edit.

/**
 * @example
 *     {
 *         url: "https://example.com/*",
 *         carrier: "web",
 *         run_id: "run_default"
 *     }
 */
export interface ListContentsRequest {
    /** Only records whose `source.url` equals it, or starts with it when it ends in `*`, the one place a `*` may stand; the scheme and the host are compared in lower case. At most 2,048 characters. Default none. */
    url?: string | undefined;
    /** Only records of this kind of source: `web`, a live page; `archive`, an archive's copy read under `as_of_date`; `upload`, bytes you sent. An open set. Default none. */
    carrier?: string | undefined;
    /** Only records of this run, an existing run of the key. Default none. */
    run_id?: string | undefined;
    /** At most this many records on the page, from 1; default 50; the maximum, 200, stands in `Limits.bounds`, and a larger value is lowered with the notice `page_size_lowered`. */
    page_size?: number | undefined;
    /** The next page, as the last answer's `next_page_token` gave it; opaque, at most 1,024 characters, never built by the caller. Default none, the first page. */
    page_token?: string | undefined;
}
