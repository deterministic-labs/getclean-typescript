// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * How the answer was made: the version, its configuration, the model steps that ran and the time it took.
 */
export interface Execution {
    /** getclean's version, the value `pinned_version` pins and `Limits.current_version` names. */
    version: string;
    /** The read configuration as one published string, fixed with the version by `pinned_version`. Under one version and one configuration the same page, or the same bytes, give the same text and the same ids. */
    configuration: string;
    /** Every model step, and every versioned recognition step, that ran in making this answer, each with its version; `[]` when none ran. */
    models: GetClean.ModelStep[];
    /** The seconds the work took. */
    elapsed_seconds: number;
    /** A trusted time over the record's fingerprint and the screenshot's digest. Not sent in this version. */
    time_stamp?: GetClean.TimeStamp | undefined;
}
