// Generated from the getclean API contract; do not edit.

/**
 * One side of a comparison.
 */
export interface ComparisonSide {
    /** When the side's record was fetched. Absent when the side is a text you hold yourself. */
    fetched_at?: string | undefined;
    /** The side's fingerprint. */
    fingerprint: string;
    /** True when getclean checked the side's fingerprint: always on a record, and on a text you hold yourself once its hash matched. */
    verified: boolean;
}
