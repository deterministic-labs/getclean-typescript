// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../../index.js";

/**
 * @example
 *     {
 *         items: [{
 *                 url: "https://a.example/report",
 *                 label: "a"
 *             }, {
 *                 url: "https://b.example/filing",
 *                 label: "b",
 *                 baseline_fingerprint: "sha-256=:kw4QGoYGxOYpZ0EZGL+nxMfFUXfrxcp+P0M4EOrEiH4=:"
 *             }, {
 *                 url: "http://10.0.0.7/admin",
 *                 label: "c"
 *             }],
 *         max_total_characters: 60000,
 *         max_cost: {
 *             amount: "0.1000",
 *             currency: "USD"
 *         },
 *         formats: ["json"],
 *         block_kinds: ["table"]
 *     }
 */
export interface FetchContentsBatchRequest {
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
    /** The fetches, 1 to 20 `ContentsBatchItem` objects, answered in this order. Required. The same URL may stand twice and makes two records. */
    items: GetClean.ContentsBatchItem[];
    /** The most text to return per record, in characters. `0` returns no text but the map of sections and the facts. Default 20,000; `0`, or 1,000 to 1,000,000; a value between 1 and 999 is refused `bound`. */
    max_characters?: number | undefined;
    /** The most text in the whole answer, every record's text and links together, links counted by their url and text. Records take their text in input order while it fits in what remains; a record that would pass it comes as `sections_only` with the notice `total_characters_cut`, and `get_contents` returns its text free. Default 200,000; 1,000 to 2,000,000, a value below `max_characters` allowed. */
    max_total_characters?: number | undefined;
    /** The most seconds each item may work, counted from its own start, as on `fetch_contents`; the whole call ends at `bounds.contents.batch_seconds`, and an item not started by then is skipped. 5 to 90; default 30. */
    wait_seconds?: number | undefined;
    /** The most the whole call may cost, in the account's currency. It is reserved per item in input order, each item's smallest call and the units it asks for by name, and what remains is one shared sum the documents' pages spend. Default the key's cap on one call. A value below one item's smallest call is refused `cost-exceeds-cap`, with `minimum_cap`. */
    max_cost?: GetClean.Money | undefined;
    /** Which view to return for every item: `main`, the main content alone, or `whole_page`, everything on the page. Default `main`. A document has one view, so `whole_page` on a document makes the notice `field_not_applicable`. */
    scope?: GetClean.Scope | undefined;
    /** The formats to return for every item, 0 to 7 of these: `markdown`, the content as one markdown string; `html`, as clean HTML; `doclang`, as DocLang, an XML that keeps each block with its place on the page; `json`, as `Block` objects; `links`, every link with its kind; `screenshot`, a picture of the whole page; `raw_html`, the page's bytes exactly as served. `[]` returns the facts only. Default `["markdown"]`. An open set; a repeated value is refused `duplicate`, a value outside the set `not_allowed`. `doclang`, `screenshot` and `raw_html` apply to a web page only; on a document each makes the notice `field_not_applicable`. */
    formats?: string[] | undefined;
    /** Keep only blocks of these kinds, in every format and in every model step, for every item: 1 to 10 of `text`, `heading`, `code`, `math`, `divider`, `interactive`, `table`, `image`, `embed`, `media`, an open set. Default: every kind. An empty list is refused `bound`. */
    block_kinds?: string[] | undefined;
    /** Your own fields, filled from each record by a model, each value with the words it came from; one model step per record, needs `contents:model`. As on `fetch_contents`: a JSON Schema 2020-12 object whose root is `type: object` with `properties`, at most 50 KB, refused `syntax` when it is not valid JSON Schema and `not_allowed` when its root is not `type: object`, it has no `properties`, or its `pattern` needs backtracking; `model-work-refused` under `deterministic_only`, `policy-limit-exceeded` under a key whose policy forbids model work. Default none. */
    json_schema?: Record<string, unknown> | undefined;
    /** Have a model write a summary of each record, at most 1,500 characters, in the content's language, as on `fetch_contents`; one model step per record, needs `contents:model`. Default false. Under `deterministic_only` it is refused `model-work-refused`; under a key whose policy forbids model work, `policy-limit-exceeded`. */
    summary?: boolean | undefined;
    /** Turn off, for every item, every step whose output could differ between two runs of the same input, as on `fetch_contents`: no judged highlight, no schema fill, no summary, and the publisher's kind only from what getclean already knows. Text recognition on a scanned page still runs and is listed, since it repeats under one version. Default false. A key whose policy forbids model work makes it true, with the notice `default_set_by_policy`; sending false under such a key is `policy-limit-exceeded`. */
    deterministic_only?: boolean | undefined;
    /** Read every page as an archive kept it on that day, the latest capture at or before the end of the day, UTC; an item's own `as_of_date` overrides it. A date not after today in UTC. Default none, the live pages. */
    as_of_date?: string | undefined;
    /** The country every page is read from, ISO 3166-1 alpha-2, one of the countries getclean can read from, `Limits.exits`; an item's own `subject_country` overrides it. Default the key's `default_exit`. A country getclean cannot read from is refused `not_allowed`, with the countries it can read from in `allowed_values`. */
    subject_country?: string | undefined;
    /** The language to ask every site for, as its `Accept-Language`, a BCP 47 tag of 1 to 35 characters; an item's own `subject_language` overrides it. Default none: getclean sends its usual `Accept-Language`, which `source.visitor.language` reports. */
    subject_language?: string | undefined;
    /** The languages to expect on scanned pages, for every item that serves a document: 1 to 10 BCP 47 tags of 1 to 35 characters each, among `Limits.recognition_languages`; another is refused `not_allowed`. Default detected, as on `fetch_contents`. */
    recognition_languages?: string[] | undefined;
    /** The most you would allow getclean to pay a site that asks a price for its page, for every item, as on `fetch_contents`. getclean pays no site, whatever the value: a page that asks a price ends that record `payment_required`, with the price in its `cost.source_price`. Default none. */
    max_source_price?: GetClean.Money | undefined;
    /** How long every record of the batch is kept, `hold` or `none`, as on `fetch_contents`. Default the key's `policy.retention`; `hold` is allowed only under a `hold` policy. */
    retention?: GetClean.Retention | undefined;
    /** The version of getclean every item runs under, at most 64 characters; `execution.version` equals it on every record. Default the current version, `Limits.current_version`. A version not served, never or no longer, is `version-withdrawn`, with the versions served. */
    pinned_version?: string | undefined;
    /** The run every record belongs to, an existing run of the key. Default the key's default run. An unknown run is refused `not_allowed`. */
    run_id?: string | undefined;
    /** Your own labels, returned on every record as sent and never passed to a site: at most 20 string pairs, keys of 1 to 64 characters, values of 1 to 512. Default none. An empty map is refused `bound`. */
    metadata?: Record<string, string> | undefined;
}
