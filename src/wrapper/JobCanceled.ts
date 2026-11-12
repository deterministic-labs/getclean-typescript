import type * as api from "../api/index.js";
import { GetCleanError } from "../errors/index.js";

/**
 * The upload's job was canceled before a record was made. The job is on the error. One of the SDK's own errors, so
 * a catch of GetCleanError takes it too.
 */
export class JobCanceled extends GetCleanError {
    public readonly job: api.Job;

    constructor(job: api.Job) {
        super({ message: `The job ${job.id} was canceled before a record was made.` });
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = "JobCanceled";
        this.job = job;
    }
}
