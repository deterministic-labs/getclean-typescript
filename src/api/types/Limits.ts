// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * Your key's limits and your account's money, the answer of `get_limits`. Read it once before a batch or a long run: every price, bound and default you may meet stands here. It is the key's own and is never cached.
 */
export interface Limits {
    /** Prepaid credit left, after the sums reserved by calls in flight. */
    balance: GetClean.Money;
    /** What the account has used in its current billing period, from `starts_at` to `ends_at`. */
    usage: GetClean.Usage;
    /** Every unit's price, keyed by unit name: `contents`, `model_steps`, `screenshots`, `document_pages`, `recognized_pages`, `searches` and `datasource_queries`, an open set. */
    prices: Record<string, GetClean.Money>;
    /** The key's cap on one call, the default run's budget and the key's budget. */
    caps: GetClean.Caps;
    /** The key's rate: requests per minute, calls in flight at once, and when the minute's window resets; one rate for every operation. */
    rates: GetClean.Rates;
    /** The published bounds of both families: every request field's range and default, and the service's own limits. */
    bounds: GetClean.Bounds;
    /** The document types the upload and a document at a URL take, as IANA media types. The families: the Office formats old and new, ODF, PDF, EPUB, RTF, Markdown, CSV and HWP, with HTML, XHTML, XML, JSON, YAML, plain text and source files. This list is the exact set. */
    document_media_types: string[];
    /** The countries `subject_country` may name on a fetch, ISO 3166-1 alpha-2. */
    exits: string[];
    /** The languages text recognition can be asked for on a page with no text layer, BCP 47 tags; another is refused `not_allowed`. */
    recognition_languages: string[];
    /** The archives an as-of fetch consults, by display name. */
    archives: string[];
    /** The country a fetch is made from when it names none, ISO 3166-1 alpha-2. */
    default_exit: string;
    /** The key's settings and minimums, set by the account owner. */
    policy: GetClean.Policy;
    /** Every version served, each with its release and, once announced, its retirement. */
    versions: GetClean.Version[];
    /** The version a request without `pinned_version` runs under. */
    current_version: string;
    /** The least number of days a version and its configuration keep being served after their change is announced. */
    version_minimum_days: number;
    /** This call's id, the same as the `Request-Id` header. */
    request_id: string;
}
