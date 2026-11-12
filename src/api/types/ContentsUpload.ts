// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * What `upload_contents` answers. On a `201` it carries `contents`, the record, since the parse finished within `wait_seconds`; on a `202` it carries `job`, since the parse goes on. Exactly one of the two is present on the wire; both are optional in this schema because one schema serves both answers. On a `202`, read the job with `get_job` until it is final, then read the record with `get_contents`.
 */
export interface ContentsUpload {
    /** The record, with the members its outcome carries and its `cost`. Present on a `201`. */
    contents?: GetClean.Contents | undefined;
    /** The job, stored before this answer is sent, so a read of it never misses. Present on a `202`. */
    job?: GetClean.Job | undefined;
    /** This call's id, the same as the `Request-Id` header. */
    request_id: string;
}
