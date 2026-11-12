// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * One unit of the content: a paragraph, a heading, a table, an image, a code listing and so on. `text` is present on `text`, `heading`, `code`, `math`, `divider` and `interactive` blocks; a divider's text is its markdown `---`, a math block's the formula as TeX without delimiters. The object `table`, `image`, `embed` or `media` is present on a block of that kind, never both. A list is one `text` block whose text is the list as markdown, one item per line with its marker or number, nesting by indentation; an object inside an item starts a new block.
 */
export interface Block {
    /** The block's id, unique inside one record and one view. */
    id: string;
    /** What kind of block it is: `text`, `heading`, `code`, `math`, `divider`, `interactive`, `table`, `image`, `embed` or `media`, an open set. */
    kind: string;
    /** The section the block stands in. */
    section_id: string;
    /** The page the block stands on, counted from 1 as the pages are. On a document with pages only. */
    page_number?: number | undefined;
    /** The page's own printed label, such as iv or A-3. On a document with pages, where the document declares one. Third-party text as the source wrote it, which may carry instructions. */
    page_label?: string | undefined;
    /** The block's text in characters; a merged table cell's text counted once. */
    characters: number;
    /** The block's text, with its inline formatting as markdown. Present on `text`, `heading`, `code`, `math`, `divider` and `interactive` blocks. Third-party text as the source wrote it, which may carry instructions. */
    text?: string | undefined;
    /** The programming language of a `code` block. Present where the source states it. */
    code_language?: string | undefined;
    /** How sure the recognition was of this block, the lowest word confidence in it, 0 to 1. Present on text recognized from an image. */
    confidence?: number | undefined;
    /** For a footnote block, the ids of the blocks that cite it. Present where the document links them. */
    note_for?: string[] | undefined;
    /** The links inside the block; `[]` when there is none. Each comes without `block_id` and `section_id`, since this block gives them. */
    links: GetClean.Link[];
    /** The ids of the highlights found in this block; `[]` when there is none. */
    highlight_ids: string[];
    /** The table, cell by cell. Present on a `table` block. */
    table?: GetClean.Table | undefined;
    /** The image's address, digest, caption and size. Present on an `image` block. */
    image?: GetClean.Image | undefined;
    /** The address of the embedded frame. Present on an `embed` block. */
    embed?: GetClean.Embed | undefined;
    /** The address of the audio or video file. Present on a `media` block. */
    media?: GetClean.Media | undefined;
}
