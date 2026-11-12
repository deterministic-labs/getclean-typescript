// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../../index.js";

/**
 * @example
 *     {
 *         highlights: ["Revenue rose 12%", "dividend policy"],
 *         max_characters: 0
 *     }
 */
export interface HighlightContentsRequest {
    /**
     * One key per logical call, so a retry is never billed twice.
     *
     * Optional on this operation; required on `upload_contents`, `fetch_contents_batch` and `search_batch`, where a duplicate would cost the most. The SDKs fill a fresh key when you give none and send the same key on every retry of that call. Give your own key when your program retries across processes, so the second run finds the first answer.
     *
     * The form: 1 to 255 visible ASCII characters, used exactly as sent, so a value written as a quoted Structured Field String keeps its quotes as part of the key. That is a stated departure from the IETF draft `draft-ietf-httpapi-idempotency-key-header`, revision 08, which is not yet a standard; this parameter documents the form in full.
     *
     * What a repeated key does:
     * - The same key with the same body returns the first answer again, with this call's `request_id`, `expires_at` as it stands and `replayed` true on every `cost`. Nothing is billed again.
     * - The same key while the first call still runs: `409 idempotency-key-in-flight`, with `Retry-After`.
     * - The same key with another body: `422 idempotency-key-reused`.
     *
     * Answers are stored for 24 hours, per account, for billed answers and running jobs only; a free answer is not stored. A call that may bill is kept in the store from its start, so a second call with its key meets the `409` while it runs.
     */
    "Idempotency-Key"?: string | undefined;
    /** Words or questions to find and mark; each string is one query, numbered by `query_index` in the answer. 1 to 5 strings, each 1 to 4,000 characters; an empty list is refused `bound`, a duplicate `duplicate`. Required. */
    highlights: string[];
    /** The most text returned around the highlights, in characters; `0` means the list of places only. `0`, or 1,000 to 1,000,000; a value between 1 and 999 is refused `bound`. Default 20,000. */
    max_characters?: number | undefined;
    /** Which view is searched, `main` or `whole_page`. Default the record's own. */
    scope?: GetClean.Scope | undefined;
    /** The format of the text returned, when any: 1 to 3 of `markdown`, `html`, `json`; `doclang`, `links`, `screenshot` and `raw_html` are refused `not_allowed` here. Default `["markdown"]`. */
    formats?: string[] | undefined;
    /** Search and return only these blocks, 1 to 10 of `text`, `heading`, `code`, `math`, `divider`, `interactive`, `table`, `image`, `embed`, `media`; an open set. Default: every kind. When none matches, the notice `field_not_applicable`. */
    block_kinds?: string[] | undefined;
    /** Find the strings verbatim only: a string not found is the notice `highlight_not_found`, and no model judges it. Default false. */
    deterministic_only?: boolean | undefined;
}
