// Generated from the getclean API contract; do not edit.

/**
 * @example
 *     {
 *         state: "completed",
 *         kind: "upload_contents"
 *     }
 */
export interface ListJobsRequest {
    /** Only jobs in this state; `queued`, `running`, `completed`, `failed` or `canceled`, the last three final; an open set. Default none. */
    state?: string | undefined;
    /** Only jobs of this kind, `upload_contents`, an open set. Default none. */
    kind?: string | undefined;
    /** At most this many jobs on the page, from 1; default 50; the maximum, 200, stands in `Limits.bounds`, and a larger value is lowered with the notice `page_size_lowered`. */
    page_size?: number | undefined;
    /** The next page, as the last answer's `next_page_token` gave it; opaque, at most 1,024 characters, never built by the caller. Default none, the first page. */
    page_token?: string | undefined;
}
