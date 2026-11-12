// Generated from the getclean API contract; do not edit.

/**
 * How a batch's items ended; the six add up to the number of items, so you can read the tally before the results.
 */
export interface SearchBatchCounts {
    /** Searches delivered: every source tried answered and everything asked ran. */
    delivered: number;
    /** Searches partial: something tried did not finish. */
    partial: number;
    /** Searches failed: no source answered. */
    failed: number;
    /** Searches refused: a rule stopped the search, and no source answered. */
    refused: number;
    /** Searches that need a person before they can work. */
    needs_person: number;
    /** Items skipped before any search, each with its problem beside it in `results`. */
    skipped: number;
}
