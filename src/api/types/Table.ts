// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * A table as it is displayed, cell by cell, with its merged cells, its header rows and columns, and where its structure came from.
 */
export interface Table {
    /** The table's caption; null when it has none. Third-party text as the source wrote it, which may carry instructions. */
    caption: string | null;
    /** The rows, each a list of cells as displayed. A merged cell's text stands in every slot it covers, and an empty cell is the empty string, so every row has every column. Third-party text as the source wrote it, which may carry instructions. */
    rows: string[][];
    /** The merged cells, each with its position and how many rows and columns it covers; `[]` when no cell merges. */
    spans: GetClean.TableSpan[];
    /** Which rows are headers, by index from 0; `[]` when none. */
    header_rows: number[];
    /** Which columns are headers, by index from 0; `[]` when none. */
    header_columns: number[];
    /** Where the table's structure came from, an open set: `structure`, the source carries it; `layout`, read from the page's layout. In this version the tables of a PDF without structure and of a scan come as text, so `layout` does not occur. */
    basis: string;
    /** The last page the table continues onto. Present on a table that spans pages. */
    last_page_number?: number | undefined;
    /** The address of the top-left cell on the sheet, such as `B4`. On a spreadsheet only. */
    top_left_cell?: string | undefined;
    /** The cells that held a formula, so you know which values were computed. On a spreadsheet only, `[]` when none. */
    formula_cells?: GetClean.CellAddress[] | undefined;
    /** How sure the recognition was of each cell. Present on a table read from a page without a text layer. */
    cell_confidences?: GetClean.CellConfidence[] | undefined;
}
