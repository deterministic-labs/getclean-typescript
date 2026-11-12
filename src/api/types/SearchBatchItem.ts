// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * One search of a batch: the question with its own wordings, identifiers, country and purpose, each as `search` defines it, and the caller's label; every other field comes from the top of the request. `query` or `subject_identifiers` is required. The object is closed.
 */
export interface SearchBatchItem {
    /** Your label for this item, returned on its result so you can match answers to questions; 1 to 64 of `a-z`, `0-9` and `-`, unique within the batch, a repeat refused `duplicate`. Default none. */
    label?: string | undefined;
    /** The question, 1 to 2,000 characters; required unless `subject_identifiers` is sent. `"phrase"`, `-word`, `OR`, one level of `( )`, `site:`, `filetype:`, `intitle:`, `inurl:`, `before:`, `after:` and `*` are honored where a source supports them, and the receipt's `operators_applied` says what each source did with each. */
    query?: string | undefined;
    /** Other wordings of the question, in any language, each 1 to 2,000 characters, up to 10; one merged list with `query`, 20 wordings at most after OR splits. Default none. Without `query` it is refused `dependent`. */
    alternate_queries?: string[] | undefined;
    /** Exact codes of the subject, up to 10 `SubjectIdentifier` objects; with no `query`, each identifier's value runs as a wording with origin `identifier`. Default none. */
    subject_identifiers?: GetClean.SubjectIdentifier[] | undefined;
    /** The country this item's search is made from, ISO 3166-1 alpha-2; the inline fetch reads from it when it is a country getclean can read from, one of `Limits.exits`. Default none. */
    subject_country?: string | undefined;
    /** Your reason for this item's search, kept in its record and read by every model step; never sent to a source. At most 2,000 characters. Default none. */
    purpose?: string | undefined;
}
