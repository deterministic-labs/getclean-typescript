// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../../index.js";

/**
 * @example
 *     {
 *         url: "https://example.com/q3",
 *         highlights: ["Revenue rose 12%", "what drove the margin"],
 *         summary: true
 *     }
 *
 * @example
 *     {
 *         url: "https://shop.example/offer"
 *     }
 */
export interface FetchContentsRequest {
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
    /** The address to fetch, a page or a document; getclean tells which. Required. http or https, at most 2,048 characters. A scheme other than http or https, or a password in the URL's userinfo, is refused `invalid-field`, `syntax`; localhost, an address that is not globally reachable or a bad port is `destination-refused`; a host outside the key's domain policy is `policy-limit-exceeded`. */
    url: string;
    /** The most text to return, in characters. `0` returns no text but the map of sections and the facts, which is how you see a document's size before paying for its text. Default 20,000; `0`, or 1,000 to 1,000,000; a value between 1 and 999 is refused `bound`. */
    max_characters?: number | undefined;
    /** Which view to return: `main`, the main content alone, or `whole_page`, everything on the page. Default `main`. A document has one view, so `whole_page` on a document makes the notice `field_not_applicable`. */
    scope?: GetClean.Scope | undefined;
    /** The formats to return, 0 to 7 of these: `markdown`, the content as one markdown string; `html`, as clean HTML; `doclang`, as DocLang, an XML that keeps each block with its place on the page; `json`, as `Block` objects; `links`, every link with its kind; `screenshot`, a picture of the whole page; `raw_html`, the page's bytes exactly as served. `[]` returns the facts only. Default `["markdown"]`. An open set; a repeated value is refused `duplicate`, a value outside the set `not_allowed`. `doclang`, `screenshot` and `raw_html` apply to a web page only; on a document each makes the notice `field_not_applicable`. */
    formats?: string[] | undefined;
    /** Keep only blocks of these kinds, in every format and in every model step: 1 to 10 of `text`, `heading`, `code`, `math`, `divider`, `interactive`, `table`, `image`, `embed`, `media`, an open set. Default: every kind. An empty list is refused `bound`. When nothing would use it, no text format, no `links`, no `highlights`, no `json_schema` and no `summary`, the notice `field_not_applicable` says so. */
    block_kinds?: string[] | undefined;
    /** Words or questions to find in the content and mark where they stand, 1 to 5 strings of 1 to 4,000 characters each. Each string is one query, and every place it finds carries its position as `query_index`. Default none. Sending this without `deterministic_only` needs `contents:model`, since a string may need a model. A string found verbatim costs nothing; the strings a model had to judge cost one model step for the whole call. */
    highlights?: string[] | undefined;
    /** Your own fields, filled from the content by a model, each value with the words it came from; one model step, needs `contents:model`. A JSON Schema 2020-12 object whose root is `type: object` with `properties`, at most 50 KB. Default none. A schema that is not valid JSON Schema is refused `syntax`; one whose root is not `type: object`, that has no `properties`, or whose `pattern` needs backtracking is refused `not_allowed`. Under the request's `deterministic_only` it is refused `model-work-refused`; under a key whose policy forbids model work, `policy-limit-exceeded`. */
    json_schema?: Record<string, unknown> | undefined;
    /** Have a model write a summary of the content, at most 1,500 characters, in the content's language; one model step, needs `contents:model`. Default false. Under the request's `deterministic_only` it is refused `model-work-refused`; under a key whose policy forbids model work, `policy-limit-exceeded`. */
    summary?: boolean | undefined;
    /** Turn off every step whose output could differ between two runs of the same input: no judged highlight, no schema fill, no summary, and the publisher's kind only from what getclean already knows. The text and the ids repeat on every call of the same input under one version in any case; with this on, every other part of the answer repeats too, but for what belongs to the call itself: `request_id`, `fetched_at`, `expires_at`, `elapsed_seconds` and `cost`. Text recognition on a scanned page still runs and is listed, since it repeats under one version. Default false. A key whose policy forbids model work makes it true, with the notice `default_set_by_policy`; sending false under such a key is `policy-limit-exceeded`. */
    deterministic_only?: boolean | undefined;
    /** The fingerprint of a copy you already hold, as a record returned it. When the page still matches it, the answer is `unchanged` with no text, at the fetch's price, and you know nothing moved. Default none. A malformed value is refused `syntax`. A fingerprint no record of your account issued makes the notice `fingerprint_unknown`, and one issued under another scope, version, configuration or kind of source the notice `fingerprint_incomparable`; in both cases the fetch runs whole. */
    baseline_fingerprint?: string | undefined;
    /** Read the page as an archive kept it on that day: the latest capture at or before the end of the day, UTC. A date not after today in UTC. Default none, the live page. On an archive copy, `subject_country`, `subject_language`, `screenshot` and `max_source_price` do not apply, a notice each. */
    as_of_date?: string | undefined;
    /** The country the page is read from, ISO 3166-1 alpha-2, one of the countries getclean can read from, `Limits.exits`. Default the key's `default_exit`. A country getclean cannot read from is refused `not_allowed`, with the countries it can read from in `allowed_values`. On a live page or a document at a URL only. */
    subject_country?: string | undefined;
    /** The language to ask the site for, as its `Accept-Language`, a BCP 47 tag of 1 to 35 characters. Default none: getclean sends its usual `Accept-Language`, which `source.visitor.language` reports. On a live page or a document at a URL only. */
    subject_language?: string | undefined;
    /** The languages to expect on scanned pages, 1 to 10 BCP 47 tags of 1 to 35 characters each, among `Limits.recognition_languages`; another is refused `not_allowed`. Default detected: the document's declared language, else the language of its text, else the script found on the page. On a document only; on a web page the notice `field_not_applicable` says so. */
    recognition_languages?: string[] | undefined;
    /** The most seconds this call may work, the read of the page or the document, every model step and the screenshot inside, counted from the moment the work starts; time spent waiting to start is not counted. 5 to 90; default 30. What did not finish by then is cut in the published order with a notice, or the outcome says so. */
    wait_seconds?: number | undefined;
    /** The most this call may cost, in the account's currency, reserved at the start against the balance and the budgets. Default the key's cap on one call. A value below the smallest call's price is refused `cost-exceeds-cap`, with `minimum_cap`. */
    max_cost?: GetClean.Money | undefined;
    /** The most you would allow getclean to pay a site that asks a price for the page. getclean pays no site, whatever the value: a page that asks a price ends `payment_required`, with the price in `cost.source_price`. Default none. */
    max_source_price?: GetClean.Money | undefined;
    /** How long the record is kept. `none` keeps nothing past this answer, so the screenshot and the raw HTML travel inline; `hold` keeps the record 48 hours after its last call, at most 30 days, and is allowed only under a `hold` policy, since a request never loosens the key. Default the key's `policy.retention`. */
    retention?: GetClean.Retention | undefined;
    /** The version of getclean to run under, at most 64 characters; it fixes the read configuration and every model step's version with it, and `execution.version` equals it. Default the current version, `Limits.current_version`. A version not served, never or no longer, is `version-withdrawn`, with the versions served. */
    pinned_version?: string | undefined;
    /** The run the record belongs to, an existing run of the key; a key has one run, `run_default`. Default the key's default run. An unknown run is refused `not_allowed`. */
    run_id?: string | undefined;
    /** Your own labels, returned on the record as sent and never passed to a site: at most 20 string pairs, keys of 1 to 64 characters, values of 1 to 512. Default none. An empty map is refused `bound`. */
    metadata?: Record<string, string> | undefined;
}
