// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * One page of the account's jobs, the answer of `list_jobs`, newest first.
 */
export interface JobPage {
    /** The jobs of this page; `[]` when none matches. */
    jobs: GetClean.Job[];
    /** The token for the next page; pass it as `page_token`. Present while more remains, and a page that carries it always has at least one job. */
    next_page_token?: string | undefined;
    /** This call's notices, `page_size_lowered`; `[]` when there is none. */
    notices: GetClean.Notice[];
    /** This call's id, the same as the `Request-Id` header. */
    request_id: string;
}
