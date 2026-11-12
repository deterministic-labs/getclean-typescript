// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../../index.js";

/**
 * @example
 *     {
 *         json_schema: {
 *             "type": "object",
 *             "properties": {
 *                 "revenue_growth": {
 *                     "type": "string"
 *                 },
 *                 "dividend": {
 *                     "type": "string"
 *                 }
 *             }
 *         }
 *     }
 */
export interface FillSchemaRequest {
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
    /** The properties to fill, a JSON Schema 2020-12 object whose root is `type: object` with `properties`, at most 50 KB; refused `syntax` when it is not valid JSON Schema, `not_allowed` when its root is not `type: object`, it has no `properties`, or its `pattern` needs backtracking. Required. */
    json_schema: Record<string, unknown>;
    /** Read only these blocks, 1 to 10 of `text`, `heading`, `code`, `math`, `divider`, `interactive`, `table`, `image`, `embed`, `media`; an open set. Default: every kind. When none matches, the notice `field_not_applicable` and every status `absent`. */
    block_kinds?: string[] | undefined;
    /** Which view is read, `main` or `whole_page`. Default the record's own. */
    scope?: GetClean.Scope | undefined;
}
