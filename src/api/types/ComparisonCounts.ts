// Generated from the getclean API contract; do not edit.

/**
 * The tally of a comparison, by kind of change.
 */
export interface ComparisonCounts {
    /** Blocks only on the current side. */
    added: number;
    /** Blocks only on the baseline side. */
    removed: number;
    /** Blocks paired above the published similarity whose text differs. */
    changed: number;
    /** Blocks with the same text at another position in the block order. */
    moved: number;
}
