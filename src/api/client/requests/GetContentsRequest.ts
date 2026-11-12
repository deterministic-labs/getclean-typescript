// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../../index.js";

/**
 * @example
 *     {
 *         max_characters: 200000,
 *         formats: ["markdown"]
 *     }
 */
export interface GetContentsRequest {
    /** The most text to return, in characters. `0` returns no text but the map of sections and the facts. Default 20,000; `0`, or 1,000 to 1,000,000; a value between 1 and 999 is refused `bound`. */
    max_characters?: number | undefined;
    /** Which view to return: `main`, the main content alone, or `whole_page`, everything on the page from the same read. Default the record's own view, `record_scope`. A document has one view, so `whole_page` on a document record makes the notice `field_not_applicable`. */
    scope?: GetClean.Scope | undefined;
    /** The formats to return, 1 to 5 of these, one value per repeated key: `markdown`, the content as one markdown string; `html`, as clean HTML; `doclang`, as DocLang, an XML that keeps each block with its place on the page, on a page or an HTML file only; `json`, as `Block` objects; `links`, every link with its kind. Default `markdown`. `screenshot` and `raw_html` are not values here; the ones the fetch made come with every answer. An open set; a key sent with an empty value is an empty list, refused `bound`, and a repeated value is refused `duplicate`. */
    formats?: string | string[] | undefined;
    /** Keep only blocks of these kinds, in every format: 1 to 10 of `text`, `heading`, `code`, `math`, `divider`, `interactive`, `table`, `image`, `embed`, `media`, an open set, one value per repeated key. Default: every kind. */
    block_kinds?: string | string[] | undefined;
}
