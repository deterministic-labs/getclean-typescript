// Generated from the getclean API contract; do not edit.

/**
 * One exact code of a subject. A certificate's or a licence's number travels as `registry` with its issuing body. The object is closed.
 */
export interface SubjectIdentifier {
    /** The kind of code: `doi`, `pmid`, `isbn`, `issn`, `arxiv`, `isin`, `lei`, `ticker`, `tax_id`, `registry`, `docket`, `reporter_citation`, `ecli`, `patent`, `asin` or `gtin`; an open set. */
    scheme: string;
    /** The code, 1 to 256 characters. */
    value: string;
    /** The catalog's code for the issuing body, 1 to 64 characters; required for `ticker`, `docket`, `tax_id` and `registry`, where its absence is refused `dependent` and a code no catalog entry lists `not_allowed`; absent otherwise, where a sent value makes the notice `field_not_applicable`. The catalog's `Datasource.issuers` lists the codes, so your agent learns one and never guesses. */
    issuer?: string | undefined;
}
