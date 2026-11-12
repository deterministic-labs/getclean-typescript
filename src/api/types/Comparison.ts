// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * The answer of `compare_contents`: both sides with their fingerprints, whether anything changed, the whole tally on every page, and the changes block by block, paged.
 */
export interface Comparison {
    /** The current record. */
    contents_id: string;
    /** When the current record expires. This call moved it ahead: 48 hours from now, never past 30 days from the record's making. */
    expires_at: string;
    /** The baseline record. Present when given. */
    baseline_contents_id?: string | undefined;
    /** The current record's side. */
    current: GetClean.ComparisonSide;
    /** The baseline's side; `fetched_at` is absent when the baseline is a text you hold yourself. */
    baseline: GetClean.ComparisonSide;
    /** Whether anything differs; true with `changes` `[]` means the words are the same and only their inline formatting moved. */
    changed: boolean;
    /** The whole tally, on every page, before the rows. */
    counts: GetClean.ComparisonCounts;
    /** The changes of this page, block by block; `[]` when none. */
    changes: GetClean.BlockChange[];
    /** The token for the next page of changes; pass it as `page_token`. Present while more remains, and a page that carries it always has at least one change. */
    next_page_token?: string | undefined;
    /** This call's notices, `fingerprint_incomparable`, `paywall_declared`, `page_size_lowered`, `version_retiring`; `[]` when none. */
    notices: GetClean.Notice[];
    /** This call's id, the same as the `Request-Id` header. */
    request_id: string;
}
