// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * The key's settings and minimums, set by the account owner. A request may tighten them for one call and never loosen them.
 */
export interface Policy {
    /** True when the policy forbids model work. Every call then runs as if it sent `deterministic_only` true, with the notice `default_set_by_policy`. */
    deterministic_only: boolean;
    /** The floor a search's `safe_search` may not go below. */
    safe_search: GetClean.SafeSearch;
    /** The account's retention mode, `hold` on a new account. A request may shorten it to `none` for one call, never lengthen it. */
    retention: GetClean.Retention;
    /** The hosts a fetch may reach and a search may count, every redirect hop included; `[]` when none is set. */
    allowed_domains: string[];
    /** The hosts a fetch never reaches and a search never counts; `[]` when none is set. */
    blocked_domains: string[];
    /** True when a URL whose query carries a parameter named `token`, `key`, `password`, `session`, `auth`, `sig` or `signature`, or any userinfo, is refused before work; off by default. */
    refuse_credential_urls: boolean;
}
