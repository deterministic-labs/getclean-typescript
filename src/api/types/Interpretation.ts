// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * How the question was read; every list present, `[]` when empty.
 */
export interface Interpretation {
    /** The question as getclean read it; with no `query`, the identifiers' values joined by a space. */
    canonical_query: string;
    /** The quoted phrases. */
    phrases: string[];
    /** The excluded words. */
    exclusions: string[];
    /** The operators read from the question. */
    operators: GetClean.QueryOperator[];
    /** Every wording that ran, with its origin. */
    wordings: GetClean.Wording[];
    /** The languages the wordings ran in, BCP 47 tags. */
    languages_searched: string[];
}
