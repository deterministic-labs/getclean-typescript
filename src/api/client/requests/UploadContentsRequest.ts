// Generated from the getclean API contract; do not edit.

import type * as core from "../../../core/index.js";
import type * as GetClean from "../../index.js";

/**
 * @example
 *     {
 *         document: createReadStream("minutes.pdf")
 *     }
 *
 * @example
 *     {
 *         document: createReadStream("records.pdf"),
 *         max_cost: {
 *             amount: "1.0000",
 *             currency: "USD"
 *         }
 *     }
 */
export interface UploadContentsRequest {
    /**
     * One key per logical call, so a retry is never billed twice.
     *
     * Required on this operation, where a duplicate would cost the most; without it the call is `400 invalid-request` naming the header. The SDKs fill a fresh key when you give none and send the same key on every retry of that call. Give your own key when your program retries across processes, so the second run finds the first answer.
     *
     * The form: 1 to 255 visible ASCII characters, used exactly as sent, so a value written as a quoted Structured Field String keeps its quotes as part of the key. That is a stated departure from the IETF draft `draft-ietf-httpapi-idempotency-key-header`, revision 08, which is not yet a standard; this parameter documents the form in full.
     *
     * What a repeated key does:
     * - The same key with the same body returns the first answer again, with this call's `request_id`, the current `expires_at` and `replayed` true on every `cost`. Nothing is billed again. On the upload the body is compared by a digest over the document and the fields, and a retried start with the same key is the same job.
     * - The same key while the first call still runs: `409 idempotency-key-in-flight`, with `Retry-After`.
     * - The same key with another body: `422 idempotency-key-reused`.
     *
     * Answers are stored for 24 hours, per account, for billed answers and running jobs only. A call that may bill is kept in the store from its start, so a second call with its key meets the `409` while it runs.
     */
    "Idempotency-Key"?: string | undefined;
    /** The file to read, as the one file part, at most 100 MiB, with any media type on the wire. The part's `filename` and `Content-Type` are hints only: the bytes decide the type, among `Limits.document_media_types`; where the bytes alone cannot tell, the declared type, then the extension, then plain text. A still image is read as one scanned page. A compressed file such as a ZIP, a mailbox file, a saved web archive, an audio or a video file is refused as the record's outcome `unsupported_media_type`. One of `document` and `url` is required. */
    document?: core.file.Uploadable | undefined;
    /** Where the file is, http or https, at most 2,048 characters, under the same address and domain rules as a fetch. getclean downloads it and reads it as an upload, as a job when the reading outlives `wait_seconds`. A URL that serves a web page is a record `refused`, `unsupported_media_type`, with the message naming `fetch_contents`. One of `document` and `url` is required. */
    url?: string | undefined;
    /** The address the page you saved came from, when `document` is a page you captured yourself, as you state it; recorded as `source.url` with `carrier` `upload`, so the record says where the page was seen. http or https, at most 2,048 characters; a scheme other than http or https is refused `syntax`. With `document` only; with `url` it is refused `dependent`. Default none. */
    captured_url?: string | undefined;
    /** When you saved the page, as you state it, an RFC 3339 instant, kept in UTC; recorded as `source.captured_at`. A value that is not an RFC 3339 instant is refused `syntax`. With `document` only; with `url` it is refused `dependent`. Default none. */
    captured_at?: string | undefined;
    /** The fingerprint of a copy you already hold, as a record returned it, `sha-256=:…:`. The bytes are checked first: when a record of this account issued the fingerprint and the file's `document_digest` matches it, the answer is `unchanged` with no parse and no page billed, at this call's price. Otherwise the parse runs and bills its pages, and a content fingerprint that matches then answers `unchanged`. Default none. A malformed value is refused `syntax`; a fingerprint no record of this account issued makes the notice `fingerprint_unknown`, and the parse runs whole. */
    baseline_fingerprint?: string | undefined;
    /** The most text to return, in characters. `0` returns no text but the map of sections and the facts, which is how you see a document's shape before reading its text. Default 20,000; `0`, or 1,000 to 1,000,000; a value between 1 and 999 is refused `bound`. */
    max_characters?: number | undefined;
    /** The formats to return, 1 to 5 of these, one part per value: `markdown`, the content as one markdown string; `html`, as clean HTML; `doclang`, as DocLang, an XML that keeps each block with its place on the page, on an HTML file only; `json`, as `Block` objects; `links`, every link with its kind. Default `["markdown"]`. A form has no part for an empty list, so a field left out takes its default and a part sent with an empty value is an empty list, refused `bound`; the map and the facts alone come by `max_characters: 0`. `screenshot` and `raw_html` are not values here, since an upload reads a file and never a live page. An open set; a repeated value is refused `duplicate`, a value outside the set `not_allowed`, and `doclang` on a document that is not HTML makes the notice `field_not_applicable`. */
    formats?: string[] | undefined;
    /** Keep only blocks of these kinds, in every format and in every model step: 1 to 10 of `text`, `heading`, `code`, `math`, `divider`, `interactive`, `table`, `image`, `embed`, `media`, an open set, one part per value. Default: every kind. In a document only `text`, `heading`, `table`, `image`, `math` and `code` occur; an HTML file takes every kind. An empty list is refused `bound`, a repeated value `duplicate`. When nothing would use it, no text format, no `links`, no `highlights`, no `json_schema` and no `summary`, the notice `field_not_applicable` says so. */
    block_kinds?: string[] | undefined;
    /** Words or questions to find in the content and mark where they stand, as on `fetch_contents`: 1 to 5 strings of 1 to 4,000 characters each, one part per value. Each string is one query, and every place it finds carries its position as `query_index`. Default none. Sending this without `deterministic_only` needs `contents:model`, since a string may need a model. A string found verbatim costs nothing; the strings a model had to judge cost one model step for the whole call. On recognized text, `exact` and `near` match the recognized words; `near` forgives case and end punctuation, and neither forgives a recognition error. */
    highlights?: string[] | undefined;
    /** Your own fields, filled from the content by a model, each value with the words it came from; one model step, needs `contents:model`. A JSON part: a JSON Schema 2020-12 object whose root is `type: object` with `properties`, at most 50 KB. Default none. A schema that is not valid JSON Schema is refused `syntax`; one whose root is not `type: object`, that has no `properties`, or whose `pattern` needs backtracking is refused `not_allowed`. Under the request's `deterministic_only` it is refused `model-work-refused`; under a key whose policy forbids model work, `policy-limit-exceeded`. */
    json_schema?: Record<string, unknown> | undefined;
    /** Have a model write a summary of the content, at most 1,500 characters, in the content's language; one model step, needs `contents:model`. Default false. Under the request's `deterministic_only` it is refused `model-work-refused`; under a key whose policy forbids model work, `policy-limit-exceeded`. */
    summary?: boolean | undefined;
    /** Turn off every step whose output could differ between two runs of the same bytes: no judged highlight, no schema fill, no summary. The text and the ids repeat on every call of the same input under one version in any case; with this on, every other part of the answer repeats too, but for what belongs to the call itself: `request_id`, `fetched_at`, `expires_at`, `elapsed_seconds` and `cost`. Text recognition on a page without a text layer still runs and is listed, since it repeats under one version. Default false. A key whose policy forbids model work makes it true, with the notice `default_set_by_policy`; sending false under such a key is `policy-limit-exceeded`. */
    deterministic_only?: boolean | undefined;
    /** The languages to expect on pages without a text layer, 1 to 10 BCP 47 tags of 1 to 35 characters each, among `Limits.recognition_languages`, one part per value; another is refused `not_allowed`. Default detected: the document's declared language, else the language of its text, else the script found on the page. With no such page it has no effect and makes no notice. */
    recognition_languages?: string[] | undefined;
    /** The most seconds this call may work before it answers, counted from the moment the work starts; time spent waiting to start is not counted. A parse that finishes inside it answers `201` with the record; one that needs more answers `202` with a job and runs on. 5 to 90; default 30. */
    wait_seconds?: number | undefined;
    /** The most this call may cost, a `Money` as a JSON part in the account's currency, reserved at the start against the balance and the budgets. A long scan is the most expensive call there is, since each recognized page bills two page units, so set it with that in mind. Default the key's cap on one call. A value below the smallest call's price is refused `cost-exceeds-cap`, with `minimum_cap`. */
    max_cost?: GetClean.Money | undefined;
    /** The most you would allow getclean to pay a site that asks a price for the document at `url`, a `Money` as a JSON part; with `document` it does nothing, the notice `field_not_applicable`. getclean pays no site, whatever the value: a site that asks a price ends `payment_required`, with the price in `cost.source_price`. Default none. */
    max_source_price?: GetClean.Money | undefined;
    /** How long the record is kept. `none` keeps nothing past the delivery: when the parse ran as a job, the record waits for the first `get_contents`, which is its delivery, and is erased after that answer. `hold` keeps the record 48 hours after its last call, at most 30 days, and is allowed only under a `hold` policy, since a request never loosens the key. Default the key's `policy.retention`. */
    retention?: GetClean.Retention | undefined;
    /** The version of getclean to run under, at most 64 characters; it fixes how documents are read and how pages are recognized, and `execution.version` equals it. Default the current version, `Limits.current_version`. A version not served, never or no longer, is `version-withdrawn`, with the versions served. */
    pinned_version?: string | undefined;
    /** The run the record belongs to, an existing run of the key; a key has one run, `run_default`. Default the key's default run. An unknown run is refused `not_allowed`. */
    run_id?: string | undefined;
    /** Your own labels, a JSON part, returned on the record as sent and never passed to a site: at most 20 string pairs, keys of 1 to 64 characters, values of 1 to 512. Default none. An empty map is refused `bound`. */
    metadata?: Record<string, string> | undefined;
}
