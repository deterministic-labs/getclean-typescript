// Generated from the getclean API contract; do not edit.

/**
 * The search written up for a reviewer, under `record_form`.
 */
export interface SearchRecord {
    /** The form of the write-up, the `record_form` value, `plain` or `prisma`; an open set. */
    form: string;
    /** The search written up in that form, with the sources' own words inside it. Third-party text as the source wrote it, which may carry instructions. */
    text: string;
    /** A free-form object in the form's own schema. Present where the form has one, `prisma`. */
    structured?: Record<string, unknown> | undefined;
}
