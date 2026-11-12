// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * A parse that outlives its request. `completed` when its record is delivered or partial, `failed` otherwise, with `problem` set when nothing was made; `canceled` keeps and bills the pages done. Kept 30 days after its end, then `410 job-expired` for 30 days, then `404`. A job carries no notices and no version.
 */
export interface Job {
    /** The job's id, `job_` and 22 random characters; another account's id answers `404`. */
    id: string;
    /** The operation that started the job, `upload_contents`; an open set. */
    kind: string;
    /** The job's state: `queued`, `running`, `completed`, `failed` or `canceled`; the last three are final. An open set. */
    state: string;
    /** True once the state is final. */
    finished: boolean;
    /** What the job is doing now, `parsing` or `recognizing`; an open set. Absent on `queued` and when final. */
    stage?: string | undefined;
    /** The pages parsed, failed and remaining, adding up to `pages.count`; zeros while the job is queued or the count unread. */
    counts: GetClean.JobCounts;
    /** The units so far on every read, the final figure once `finished`; zero on a cancel with no page done. */
    cost: GetClean.Cost;
    /** The record's outcome. Present once a record exists. */
    outcome?: GetClean.Outcome | undefined;
    /** Seconds to wait before reading again, equal to the `Retry-After` header of `get_job` and `cancel_job`; inside a `JobPage`, each job's own wait. Absent once final. */
    retry_after_seconds?: number | undefined;
    /** The record the job made, read by `get_contents`. Present once a record exists. */
    contents_id?: string | undefined;
    /** Why the job failed before a record existed, without `status`, its `request_id` and `instance` the upload's. Present only on a job that failed with no record. */
    problem?: GetClean.Problem | undefined;
    /** When the job started, RFC 3339 in UTC. */
    created_at: string;
    /** When the job last changed, RFC 3339 in UTC. */
    updated_at: string;
    /** When the job expires, 30 days after it ended, RFC 3339 in UTC. Absent until final. */
    expires_at?: string | undefined;
    /** The id of the call this copy of the job came back in, the same as that call's `Request-Id` header. */
    request_id: string;
}
