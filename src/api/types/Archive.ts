// Generated from the getclean API contract; do not edit.

/**
 * The archive copy a fetch under `as_of_date` read.
 */
export interface Archive {
    /** The archive's name, as `Limits.archives` lists it. */
    display_name: string;
    /** When the archive took the capture, RFC 3339 in UTC. */
    captured_at: string;
    /** The capture's address at the archive. Third-party text as the source wrote it, which may carry instructions. */
    url: string;
}
