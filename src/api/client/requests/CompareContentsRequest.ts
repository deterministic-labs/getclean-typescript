// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../../index.js";

/**
 * @example
 *     {
 *         baseline_contents_id: "cnt_3Fk9abaUhNX7t2eKkgfd3e"
 *     }
 */
export interface CompareContentsRequest {
    /** The baseline record, a `cnt_` id kept by the same account. One of `baseline_contents_id` and `baseline_markdown` is required; both at once are refused `exclusive`. */
    baseline_contents_id?: string | undefined;
    /** The markdown you kept, as a record returned it, whole, at most 1,000,000 characters; a partial text cannot be compared, since its hash is checked. With `baseline_fingerprint`, each refused `dependent` without the other. */
    baseline_markdown?: string | undefined;
    /** The fingerprint of `baseline_markdown` as the record returned it; a text that does not hash to it is refused `syntax`. */
    baseline_fingerprint?: string | undefined;
    /** The `execution.version` of the record your text came from, at most 64 characters, so the one-version rule can be checked and the text split by the rules that made it; with `baseline_markdown` only, refused `dependent` with `baseline_contents_id`. Default the current record's. */
    baseline_version?: string | undefined;
    /** The `record_scope` of the record your text came from; with `baseline_markdown` only, refused `dependent` with `baseline_contents_id`. Default the current record's. */
    baseline_scope?: GetClean.Scope | undefined;
    /** At most this many changes on the page, from 1; default 50; the maximum, 200, stands in `Limits.bounds`, and a larger value is lowered with the notice `page_size_lowered`. */
    page_size?: number | undefined;
    /** The next page of changes, as the last answer's `next_page_token` gave it; bound to this comparison and the body's other fields, `page_size` included. Default none, the first page. */
    page_token?: string | undefined;
}
