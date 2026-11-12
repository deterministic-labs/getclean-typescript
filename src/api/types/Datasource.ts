// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * One entry of the catalog: a place getclean can search, what it covers and what it honors, known before any search.
 */
export interface Datasource {
    /** The entry's id, the value the search's `datasources` takes. */
    id: string;
    /** The entry's display name. */
    display_name: string;
    /** The group the entry belongs to, `web` or a group the catalog publishes, an open set; a group name goes into the search's `datasources` too. */
    group: string;
    /** The countries it covers, ISO 3166-1 alpha-2; `[]` means every country, as `web`. */
    countries: string[];
    /** The languages it covers, BCP 47; `[]` means every language, as `web`. */
    languages: string[];
    /** How the source is reached, and its fee when it charges per query. */
    access: GetClean.DatasourceAccess;
    /** Whether getclean can search it; a source it cannot search is `datasource-not-searchable` when named. */
    searchable: boolean;
    /** What the source honors of the twelve hard filters, before any search, keyed by their names, `allowed_domains`, `blocked_domains`, `published_from`, `published_until`, `published_within_days`, `undated`, `languages`, `media_types`, `safe_search`, `source_kinds`, `source_independence`, `as_of_date`, every name always present. */
    filters: Record<string, GetClean.FilterState>;
    /** What the source honors of the ten query operators, keyed by `phrase`, `exclusion`, `alternatives`, `site`, `filetype`, `intitle`, `inurl`, `before`, `after`, `wildcard`, every name always present; `alternatives` stands for the `or` operator. */
    operators: Record<string, GetClean.OperatorState>;
    /** The identifier schemes the source resolves, values of `SubjectIdentifier.scheme`; `[]` when none. */
    identifier_schemes: string[];
    /** For each scheme that takes an issuer, `ticker`, `docket`, `tax_id` and `registry`, the issuer codes this source resolves, so your agent learns a code from the catalog and never guesses one. Present when the source resolves such a scheme. */
    issuers?: Record<string, string[]> | undefined;
    /** Whether `as_of_date` is honored; a source without history reports `no_history`. */
    history: boolean;
    /** The entry's own page in the catalog, with its full description. */
    card_url: string;
    /** The id of the call this entry came back in, the same as that call's `Request-Id` header. */
    request_id: string;
}
