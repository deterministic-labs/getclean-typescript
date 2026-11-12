// Generated from the getclean API contract; do not edit.

/**
 * How sure the recognition was of one cell of a table read from a scan.
 */
export interface CellConfidence {
    /** The cell's row, from 0. */
    row: number;
    /** The cell's column, from 0. */
    column: number;
    /** The confidence, 0 to 1. */
    confidence: number;
}
