// Generated from the getclean API contract; do not edit.

/**
 * The key's rate, the same figures the `RateLimit` headers carry on every answer.
 */
export interface Rates {
    /** How many requests the key may make per minute. */
    requests_per_minute: number;
    /** How many calls the key may have in flight at once. */
    concurrency: number;
    /** When the current minute's window resets, RFC 3339 in UTC. */
    resets_at: string;
}
