// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * The fix as data. Each member is present when it applies.
 */
export interface ProblemChange {
    /** The field to change: a field of the operation `operation` names when it is present, else of this request. */
    field?: string | undefined;
    /** The values the field may take. */
    allowed_values?: string[] | undefined;
    /** The range the field may take. */
    bounds?: GetClean.Bound | undefined;
    /** The operation to call instead, by its id, one of this contract's 22 operation ids: `fetch_contents`, `list_contents`, `get_contents`, `delete_contents`, `get_section`, `list_blocks`, `list_links`, `upload_contents`, `list_jobs`, `get_job`, `cancel_job`, `fetch_contents_batch`, `highlight_contents`, `fill_schema`, `summarize_contents`, `compare_contents`, `get_limits`, `search`, `get_search`, `search_batch`, `list_datasources`, `get_datasource`; an open set. */
    operation?: string | undefined;
}
