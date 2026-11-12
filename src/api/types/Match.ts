// Generated from the getclean API contract; do not edit.

/**
 * One wording's hit on one source.
 */
export interface Match {
    /** The wording that found it, by its index from 0. */
    wording_index: number;
    /** The datasource it was found on. */
    datasource_id: string;
    /** The position in that source's list for that wording, from 1. */
    rank: number;
}
