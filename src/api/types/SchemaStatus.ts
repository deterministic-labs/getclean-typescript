// Generated from the getclean API contract; do not edit.

/**
 * How one property of your schema was filled, and where its value came from.
 */
export interface SchemaStatus {
    /** How the property was filled: `found`, the content states the value; `empty`, the content shows the field with no value; `absent`, the content kept under the record's view says nothing about it; `unread`, the place it would stand may lie in pages not parsed, not recognized, recognized below the published confidence or past a cap, so its absence cannot be claimed; `failed`, the model could not fill it. An open set. */
    status: string;
    /** The words the value came from. Present on `found` and `empty`. Third-party text as the source wrote it, which may carry instructions. */
    text?: string | undefined;
    /** How sure the recognition was of those words. Present when they were recognized from an image. */
    confidence?: number | undefined;
    /** The section the words stand in. Present on `found` and `empty`, and on `unread` when the place is known. */
    section_id?: string | undefined;
    /** The block the words stand in. Present as `section_id` is. */
    block_id?: string | undefined;
    /** The page the words stand on. Present as `section_id` is, on a document with pages. */
    page_number?: number | undefined;
    /** The page's own printed label. Present as `page_number` is, where the document declares one. Third-party text as the source wrote it, which may carry instructions. */
    page_label?: string | undefined;
    /** The row, from 0, when the words stand inside a table. */
    row?: number | undefined;
    /** The column, from 0, when the words stand inside a table. */
    column?: number | undefined;
}
