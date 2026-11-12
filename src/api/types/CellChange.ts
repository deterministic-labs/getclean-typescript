// Generated from the getclean API contract; do not edit.

/**
 * One changed cell of a table block; `row` and `column` are the after side's indexes, the before side's on a removal.
 */
export interface CellChange {
    /** The cell's row, from 0. */
    row: number;
    /** The cell's column, from 0. */
    column: number;
    /** The cell before. Absent on an added row. Third-party text as the source wrote it, which may carry instructions. */
    before_text?: string | undefined;
    /** The cell after. Absent on a removed row. Third-party text as the source wrote it, which may carry instructions. */
    after_text?: string | undefined;
}
