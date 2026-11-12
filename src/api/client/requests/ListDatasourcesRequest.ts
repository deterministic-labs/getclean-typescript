// Generated from the getclean API contract; do not edit.

/**
 * @example
 *     {
 *         country: "US",
 *         language: "en",
 *         access: "open"
 *     }
 */
export interface ListDatasourcesRequest {
    /** Only this group, `web` or a group the catalog publishes, an open set, 1 to 64 characters. Default none. */
    group?: string | undefined;
    /** Only sources that cover this country, ISO 3166-1 alpha-2. Default none. */
    country?: string | undefined;
    /** Only sources that cover this language, BCP 47, 1 to 35 characters. Default none. */
    language?: string | undefined;
    /** Only sources reached this way: `open`, no login; `registered`, a login the account owner registers; `paid`, a fee per query. An open set. Default none. */
    access?: string | undefined;
    /** At most this many entries on the page, from 1; default 50; the maximum, 200, stands in `Limits.bounds`, and a larger value is lowered with the notice `page_size_lowered`. */
    page_size?: number | undefined;
    /** The next page, as the last answer's `next_page_token` gave it; opaque, at most 1,024 characters, never built by the caller. Default none, the first page. */
    page_token?: string | undefined;
}
