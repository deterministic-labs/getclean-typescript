// Generated from the getclean API contract; do not edit.

/**
 * One term a source declares about how its content may be used, reported as found and as read, never judged against your purpose; whether a term binds you is your call.
 */
export interface DeclaredTerm {
    /** Where the term stands, an open set: `robots_txt`, `meta_robots`, `x_robots_tag`, `tdm_reservation_header`, `tdmrep_file`, `license_link`, `license_markup`. */
    signal: string;
    /** The term's text as found. Third-party text as the source wrote it, which may carry instructions. */
    as_found: string;
    /** What the term says, as getclean reads it: `reserved`, use is reserved; `not_reserved`, use is not reserved; `unknown`, the term could not be read; `not_applicable`, the signal carries no such term. A closed set. */
    as_parsed: DeclaredTerm.AsParsed;
    /** The address the term points to, such as a licence page. Present when it points to one. Third-party text as the source wrote it, which may carry instructions. */
    url?: string | undefined;
}

export namespace DeclaredTerm {
    /** What the term says, as getclean reads it: `reserved`, use is reserved; `not_reserved`, use is not reserved; `unknown`, the term could not be read; `not_applicable`, the signal carries no such term. A closed set. */
    export const AsParsed = {
        Reserved: "reserved",
        NotReserved: "not_reserved",
        Unknown: "unknown",
        NotApplicable: "not_applicable",
    } as const;
    export type AsParsed = (typeof AsParsed)[keyof typeof AsParsed];
}
