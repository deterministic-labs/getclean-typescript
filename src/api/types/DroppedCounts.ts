// Generated from the getclean API contract; do not edit.

/**
 * The results that are not leads, by reason; every integer always present; the keys are the values `dropped_reason` takes.
 */
export interface DroppedCounts {
    /** Results under the ranking model's cut-off. */
    not_relevant: number;
    /** Results with no detectable date, dropped under `undated` `hidden`. */
    undated: number;
    /** Results past `ranking_max_per_domain` for their site. */
    max_per_domain: number;
    /** Results on a site in `blocked_domains`. */
    blocked_domain: number;
    /** Results on a site outside `allowed_domains`. */
    outside_allowed: number;
    /** Results whose publisher's kind is outside `source_kinds`. */
    source_kind: number;
    /** Results outside `source_independence`. */
    source_independence: number;
    /** Results grouped behind a lead as copies of it. */
    folded_copy: number;
    /** Results that failed a quoted phrase. */
    phrase_check: number;
    /** Results that carried an excluded word. */
    exclusion_check: number;
    /** Results ranked past the cap on leads. */
    beyond_max_candidates: number;
}
