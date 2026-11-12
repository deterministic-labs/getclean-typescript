// Generated from the getclean API contract; do not edit.

/**
 * One merged cell of a table: where it starts and how far it reaches.
 */
export interface TableSpan {
    /** The row the cell starts in, from 0. */
    row: number;
    /** The column the cell starts in, from 0. */
    column: number;
    /** How many rows the cell covers, 1 or more. */
    row_span: number;
    /** How many columns the cell covers, 1 or more. */
    column_span: number;
}
