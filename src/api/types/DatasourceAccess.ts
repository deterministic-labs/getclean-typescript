// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * How a datasource is reached.
 */
export interface DatasourceAccess {
    /** How the source is reached: `open`, no login; `registered`, a login the account owner registers; `paid`, a fee per query. An open set. */
    kind: string;
    /** The fee per query. Present when the source charges one. */
    fee?: GetClean.Money | undefined;
}
