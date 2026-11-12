import type * as api from "../api/index.js";

/**
 * What this client leaves on an error beyond what the generated error carries, declared so that a caller reads it
 * without a cast: the idempotency key of a call that may bill, and the last job an upload's wait saw.
 */
declare module "../errors/GetCleanError.js" {
    interface GetCleanError {
        /** The idempotency key the failed call carried, on an error of a call that may bill, so your own repeat is a replay. */
        idempotencyKey?: string;
        /** The job as it was last seen, on the error that ended an upload's wait, so you can read it or cancel it. */
        job?: api.Job;
    }
}
