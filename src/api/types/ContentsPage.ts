// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * One page of the records the account keeps, newest first, the answer of `list_contents`. Each record is compact: its id, outcome, source and dates, with no text, no map, no model work and no cost.
 */
export interface ContentsPage {
    /** The records of this page, each a `ContentsCompact` without `cost`; `[]` when none matches. */
    contents: GetClean.ContentsCompact[];
    /** The token for the next page; pass it as `page_token`. Present while more remains, and a page that carries it always has at least one record. */
    next_page_token?: string | undefined;
    /** This call's notices, `page_size_lowered` and `version_retiring`; `[]` when there is none. */
    notices: GetClean.Notice[];
    /** This call's id, the same as the `Request-Id` header. */
    request_id: string;
}
