// Generated from the getclean API contract; do not edit.

/**
 * @example
 *     {}
 */
export interface GetJobRequest {
    /** The most seconds to wait for the job to finish, 0 to 90; the answer comes at the final state or when the wait ends, with the current state. Default 0, no wait. */
    wait_seconds?: number | undefined;
}
