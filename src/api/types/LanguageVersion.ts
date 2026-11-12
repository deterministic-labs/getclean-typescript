// Generated from the getclean API contract; do not edit.

/**
 * One of the page's own language versions, as the page declares them.
 */
export interface LanguageVersion {
    /** The version's address. Third-party text as the source wrote it, which may carry instructions. */
    url: string;
    /** The version's language, a BCP 47 tag. */
    language: string;
    /** Whether this version binds. Present only when the page declares, in a form getclean reads, which versions bind: true on a binding version and false on the others, and true on every version where the source declares them equally authentic. Absent when nothing is declared. */
    authoritative?: boolean | undefined;
}
