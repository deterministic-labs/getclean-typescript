// Generated from the getclean API contract; do not edit.

/**
 * One row of the map: a heading and everything under it, down to the next heading of the same or a higher level.
 */
export interface Section {
    /** The section's id, unique inside one record and one view. `s0` is the text before the first heading; on a page or a document without headings it is the whole text. */
    id: string;
    /** The heading's text; null when the section has no heading. Third-party text as the source wrote it, which may carry instructions. */
    title: string | null;
    /** The heading's level: 0 for the text before the first heading, 1 for a top heading, and so on down. */
    level: number;
    /** The size of the section's text in characters, everything under it included. */
    characters: number;
    /** Where the section's boundary comes from, an open set: `structure`, the page's headings or the document's own structure; `outline`, the document's outline, for a PDF without structure; `page`, one row per page, for a scan or a document with neither. */
    basis: string;
    /** The first page the section stands on. On a document with pages only. */
    first_page_number?: number | undefined;
    /** The last page the section stands on. On a document with pages only. */
    last_page_number?: number | undefined;
    /** The section's language, a BCP 47 tag. Present only where it differs from `source.language`. */
    language?: string | undefined;
}
