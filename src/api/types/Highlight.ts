// Generated from the getclean API contract; do not edit.

/**
 * One place in the content where one of your `highlights` strings was found: a sentence, a table row, a heading, a whole block or a part of one, with where it stands and how it was found.
 */
export interface Highlight {
    /** The highlight's id, unique inside the answer that made it; the same id stands in the text's marks and in each block's `highlight_ids`. */
    id: string;
    /** Which of your strings found it: its position in the request's `highlights`, from 0. */
    query_index: number;
    /** The words as they stand in the content. Third-party text as the source wrote it, which may carry instructions. */
    text: string;
    /** How it was found, an open set: `exact`, your words stand in one block as written, case kept; `near`, they stand there once case and the punctuation at the ends of words are ignored; `judged`, a model picked the block that bears on your string. `exact` and `near` repeat on every run and are free; `judged` costs one model step. */
    basis: string;
    /** The section it stands in. */
    section_id: string;
    /** The block it stands in. */
    block_id: string;
    /** The page it stands on. On a document with pages only. */
    page_number?: number | undefined;
    /** The page's own printed label. On a document with pages, where the document declares one. Third-party text as the source wrote it, which may carry instructions. */
    page_label?: string | undefined;
    /** The row, from 0, when it stands inside a table. */
    row?: number | undefined;
    /** The column, from 0, when it stands inside a table. */
    column?: number | undefined;
    /** How sure the recognition was of the block it stands in. Present on text recognized from an image. */
    confidence?: number | undefined;
}
