// Generated from the getclean API contract; do not edit.

/**
 * How a batch's items ended; the six add up to the number of items, so you can read the tally before the results.
 */
export interface ContentsBatchCounts {
    /** Records delivered: the content came whole or as the map, or the page was unchanged against its fingerprint. */
    delivered: number;
    /** Records partial: the work stopped in the middle and what was done is kept. */
    partial: number;
    /** Records failed: nothing readable came from the source. */
    failed: number;
    /** Records refused: a rule stopped the read, such as the address, the size, the type, a password, the robots file, the domain policy or a legal demand. */
    refused: number;
    /** Records that need a person before they can work. */
    needs_person: number;
    /** Items skipped before any fetch, each with its problem beside it in `results`. */
    skipped: number;
}
