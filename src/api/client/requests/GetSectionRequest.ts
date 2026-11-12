// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../../index.js";

/**
 * @example
 *     {
 *         formats: ["markdown"]
 *     }
 */
export interface GetSectionRequest {
    /** The most text to return, in characters. `0` returns the section's row and its child rows, no text. Default 20,000; `0`, or 1,000 to 1,000,000; a value between 1 and 999 is refused `bound`. */
    max_characters?: number | undefined;
    /** Which view's ids and text: `main` or `whole_page`. Default the record's own. */
    scope?: GetClean.Scope | undefined;
    /** The formats to return, over this section, 1 to 5 of these, one value per repeated key: `markdown`, the text as one markdown string; `html`, as clean HTML; `doclang`, as DocLang, an XML that keeps each block with its place on the page, on a page or an HTML file only; `json`, as `Block` objects; `links`, the section's links with their kinds. Default `markdown`. An open set; a key sent with an empty value is an empty list, refused `bound`, and a repeated value is refused `duplicate`. */
    formats?: string | string[] | undefined;
    /** Keep only blocks of these kinds, over this section: 1 to 10 of `text`, `heading`, `code`, `math`, `divider`, `interactive`, `table`, `image`, `embed`, `media`, an open set, one value per repeated key. Default: every kind. */
    block_kinds?: string | string[] | undefined;
    /** Continues a cut text, as the last answer's `next_page_token` gave it; opaque, at most 1,024 characters, alive as long as the record. Default none. */
    page_token?: string | undefined;
}
