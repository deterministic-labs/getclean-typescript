// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * One member per hard filter, every member always present.
 */
export interface FiltersApplied {
    allowed_domains: GetClean.FilterApplied;
    blocked_domains: GetClean.FilterApplied;
    published_from: GetClean.FilterApplied;
    published_until: GetClean.FilterApplied;
    published_within_days: GetClean.FilterApplied;
    undated: GetClean.FilterApplied;
    languages: GetClean.FilterApplied;
    media_types: GetClean.FilterApplied;
    safe_search: GetClean.FilterApplied;
    source_kinds: GetClean.FilterApplied;
    source_independence: GetClean.FilterApplied;
    as_of_date: GetClean.FilterApplied;
}
