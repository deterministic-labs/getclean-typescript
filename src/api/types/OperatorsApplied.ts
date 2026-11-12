// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * One member per operator, every member always present, its state `not_applicable` for an operator the query did not use; `alternatives` stands for the `or` operator, since `or` is a reserved word.
 */
export interface OperatorsApplied {
    phrase: GetClean.OperatorApplied;
    exclusion: GetClean.OperatorApplied;
    alternatives: GetClean.OperatorApplied;
    site: GetClean.OperatorApplied;
    filetype: GetClean.OperatorApplied;
    intitle: GetClean.OperatorApplied;
    inurl: GetClean.OperatorApplied;
    before: GetClean.OperatorApplied;
    after: GetClean.OperatorApplied;
    wildcard: GetClean.OperatorApplied;
}
