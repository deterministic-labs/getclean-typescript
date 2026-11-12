// Generated from the getclean API contract; do not edit.

/**
 * The source of a compact record; each member present and typed as `Source` gives it.
 */
export interface SourceCompact {
    /** The address that was asked for; on an upload, the `captured_url` given. Absent on an upload sent without `captured_url`. On a record a search made, third-party text as the source wrote it, which may carry instructions. */
    url?: string | undefined;
    /** The address the fetch ended at, after every redirect. Absent on an upload. Third-party text as the source wrote it, which may carry instructions. */
    final_url?: string | undefined;
    /** The title as the source declares it; null when none came. Third-party text as the source wrote it, which may carry instructions. */
    title: string | null;
    /** The date of publication as the source declares it, a full date; null when none. */
    published_date: string | null;
    /** The moment of publication in UTC. Present when the page states a time with its zone. */
    published_at?: string | undefined;
}
