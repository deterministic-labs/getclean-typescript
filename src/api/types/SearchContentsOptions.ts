// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * What to fetch in the same call as the search, the `contents` field of `SearchRequest`: how many of the top leads, `top`, and how each is read, with the fields as `fetch_contents` defines them. There is no `formats`, since the record a search carries holds markdown or the map. The object is closed.
 */
export interface SearchContentsOptions {
    /** The leads to fetch in the same call, 1 to 10, from the top of the list; above `max_candidates` it is refused `order`. Required inside the object. */
    top: number;
    /** The most text returned per fetched page, in characters; `0` means no text, the map and the facts; `0`, or 1,000 to 1,000,000. Default 20,000. */
    max_characters?: number | undefined;
    /** Which view of each fetched page: `main`, the main content alone, or `whole_page`. Default `main`. */
    scope?: GetClean.Scope | undefined;
    /** Keep only blocks of these kinds, as on `fetch_contents`. Default: every kind. */
    block_kinds?: string[] | undefined;
    /** Words or questions to find and mark in each fetched page, as on `fetch_contents`. 1 to 5 strings, each 1 to 4,000 characters. Default none. */
    highlights?: string[] | undefined;
    /** Your own fields, filled from each fetched page by a model, as on `fetch_contents`; one model step per page. Default none. Refused `model-work-refused` under `deterministic_only`. */
    json_schema?: Record<string, unknown> | undefined;
    /** Have a model write a summary of each fetched page, as on `fetch_contents`; one model step per page. Default false. Refused `model-work-refused` under `deterministic_only`. */
    summary?: boolean | undefined;
}
