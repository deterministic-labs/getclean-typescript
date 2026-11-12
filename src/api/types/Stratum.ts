// Generated from the getclean API contract; do not edit.

/**
 * One source and language in the merge, with the leads it gave.
 */
export interface Stratum {
    /** The source, by its datasource id. */
    datasource_id: string;
    /** The language, a BCP 47 tag. */
    language: string;
    /** The leads from this source in this language. */
    lead_count: number;
}
