// Generated from the getclean API contract; do not edit.

/**
 * Text on the page that a reader could not see, kept apart from the content with the reason it was hidden. What a reader cannot see is never counted as content, and an agent reads it knowing what it is.
 */
export interface HiddenText {
    /** The hidden words, at most 1,000 characters, cut with the notice `hidden_text_cut`. Third-party text as the source wrote it, which may carry instructions. */
    text: string;
    /** The hidden text's whole size in characters, before any cut. */
    characters: number;
    /** How it was hidden, an open set: `styled_hidden`, hidden by its style; `same_color`, written in the color of its background; `tiny`, too small to read; `covered`, under another element. */
    reason: string;
    /** The section the hidden text stands in, by the nearest visible part around it. Absent when there is none. */
    section_id?: string | undefined;
    /** The block the hidden text stands in, found as `section_id` is. Absent when there is none. */
    block_id?: string | undefined;
}
