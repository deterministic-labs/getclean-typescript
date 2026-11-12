// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * The pages of a document: how many there are, how many were parsed, which failed, which were read from an image. The pages not yet parsed are `count` less `parsed_count` less the failed pages.
 */
export interface DocumentPages {
    /** How many pages the document has. On a format without pages, a spreadsheet or a plain text file, the equivalent by characters, `bounds.contents.document_page_characters` characters of text counting as one page, rounded up. The bill counts `parsed_count`. */
    count: number;
    /** How many pages were parsed; the bill counts these. */
    parsed_count: number;
    /** The pages that could not be parsed, by number; `[]` when none. */
    failed_pages: number[];
    /** The pages that had no text layer and were read from their image; `[]` when none. */
    recognized: GetClean.RecognizedPage[];
    /** The pages that hold content the text cannot carry, handwriting, a drawing, a formula or a blacked-out region; `[]` in this version, which does not detect them. */
    pictured: GetClean.PicturedPage[];
}
