// Generated from the getclean API contract; do not edit.

/**
 * One side of a changed block.
 */
export interface ChangeSide {
    /** The section on that side. Absent on the before side when the baseline is a text you hold yourself. */
    section_id?: string | undefined;
    /** The block on that side. Absent on the before side when the baseline is a text you hold yourself. */
    block_id?: string | undefined;
    /** The page the block stands on, on that side. Present on a document with pages. */
    page_number?: number | undefined;
    /** The page's own printed label, on that side. Present where the document declares one. Third-party text as the source wrote it, which may carry instructions. */
    page_label?: string | undefined;
    /** The block's text; a table as its markdown rows, an image, embed or media block as its `url`. Third-party text as the source wrote it, which may carry instructions. */
    text: string;
}
