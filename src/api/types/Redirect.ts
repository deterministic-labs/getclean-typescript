// Generated from the getclean API contract; do not edit.

/**
 * One redirect on the way to the final address.
 */
export interface Redirect {
    /** The address this hop led to. Third-party text as the source wrote it, which may carry instructions. */
    url: string;
    /** The HTTP status that made the hop; null on a script or meta-refresh hop. */
    status_code: number | null;
}
