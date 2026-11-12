// Generated from the getclean API contract; do not edit.

/**
 * One version getclean serves.
 */
export interface Version {
    /** The version string, the value `Limits.current_version` and `execution.version` carry. */
    version: string;
    /** When it was released, RFC 3339 in UTC. */
    released_at: string;
    /** When it stops being served, RFC 3339 in UTC. Absent until announced. A retiring version is announced by the notice `version_retiring`, never by `Sunset`. */
    retires_at?: string | undefined;
    /** The page that lists what changed in this version. */
    changes_url: string;
}
