// Generated from the getclean API contract; do not edit.

/**
 * The pages of a job; the three add up to `pages.count`, on which a format without pages counts `bounds.contents.document_page_characters` characters as one page.
 */
export interface JobCounts {
    /** Pages parsed without failure; the bill counts these. */
    parsed_count: number;
    /** Pages that could not be parsed. */
    failed_count: number;
    /** Pages not yet parsed. */
    remaining_count: number;
}
