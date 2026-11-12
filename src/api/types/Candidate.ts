// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * A page found, with its facts, not yet fetched. A lead is the one page shown for a group of copies, and `copy_count` says how many stood behind it. Every member that `view: compact` leaves out is optional in this schema and present in the full view as its line says.
 */
export interface Candidate {
    /** The candidate's id, `cand_` and 22 characters, the same for the same normalized URL within your account. */
    id: string;
    /** The page's address. Third-party text as the source wrote it, which may carry instructions. */
    url: string;
    /** The address the page declares as its original. Present when declared. Third-party text as the source wrote it, which may carry instructions. */
    canonical_url?: string | undefined;
    /** The address the fetch ended at, after every redirect. Absent until fetched. Third-party text as the source wrote it, which may carry instructions. */
    final_url?: string | undefined;
    /** The page's title as the datasource states it. Present when the datasource states it. Third-party text as the source wrote it, which may carry instructions. */
    title?: string | undefined;
    /** The page's language as the datasource states it, a BCP 47 tag. Present when the datasource states it. */
    language?: string | undefined;
    /** The page's media type as the datasource states it. Present when the datasource states it. */
    media_type?: string | undefined;
    /** The page's size in characters as the datasource declares it; the fetch's measured size is `contents.counts.characters`. Present when the datasource reports it. */
    characters?: number | undefined;
    /** The document's page count as the datasource declares it. Present when the datasource reports it. */
    page_count?: number | undefined;
    /** Who publishes; what the item is; the subject about itself or not; who reviewed it. */
    source_profile: GetClean.SourceProfile;
    /** The same text found on this many other sites, grouped behind this lead; the same text is an equal normalized main text or one above a published similarity; the lead is the copy with the earliest claimed date among the copies that carry one, else the first found. Present in the full view. */
    copy_count?: number | undefined;
    /** The page's own translations as declared; `[]` when none. Present in the full view. */
    language_versions?: GetClean.LanguageVersion[] | undefined;
    /** The kind of source: `web`, a live page, or `archive`, an archive's copy read under `as_of_date`; an open set; a candidate never carries `upload`. Present in the full view. */
    carrier?: string | undefined;
    /** The date of publication the page or the datasource claims, a full date. Present when one states it. */
    published_date?: string | undefined;
    /** Where the date was read: `structured_data`, `meta_tag`, `byline`, `url` or `datasource`; an open set. Present with the date. */
    published_date_basis?: string | undefined;
    /** How exact the date is, `day`, `month` or `year`. Present with the date. */
    published_date_precision?: GetClean.DatePrecision | undefined;
    /** The date of the last change the page or the datasource claims, a full date. Present when one states it. */
    modified_date?: string | undefined;
    /** Where the modification date was read: `structured_data`, `meta_tag`, `byline`, `url` or `datasource`; an open set. Present with the date. */
    modified_date_basis?: string | undefined;
    /** The moment of publication in UTC. Present only when the page states a time with its zone. */
    published_at?: string | undefined;
    /** The moment of the last change in UTC. Present only when the page states a time with its zone. */
    modified_at?: string | undefined;
    /** When the datasource took its copy of the page. Present when known. */
    acquired_at?: string | undefined;
    /** What the datasource declares about the item. Present when the datasource declares anything. */
    declared?: GetClean.Declared | undefined;
    /** What the page demands, seen without a fetch. */
    access: GetClean.Access;
    /** The codes sent that this page carries; `[]` when none. Present in the full view. */
    identifier_matches?: GetClean.SubjectIdentifier[] | undefined;
    /** The ranking model's score, 0 to 1; null under `deterministic_only` and on `rerank_missing`. */
    relevance_score: number | null;
    /** Why this item is not a lead, one of the member names of `DroppedCounts`. A closed set. Absent on a lead; set on an item of a later page of `get_search`. */
    dropped_reason?: Candidate.DroppedReason | undefined;
    /** The lead this copy was grouped behind. Present on an item of a later page dropped as `folded_copy`. */
    lead_id?: string | undefined;
    /** The matching snippets; `[]` when none; under `view` `compact` the first excerpt only. */
    excerpts: GetClean.Excerpt[];
    /** Which wording found it where. Present in the full view only. */
    matches?: GetClean.Match[] | undefined;
    /** The most a fetch of it with this request's inline options can cost, from the price list and the known size. Absent when a document's page count is unknown. */
    fetch_cost?: GetClean.Money | undefined;
    /** The compact record of the inline fetch, with its own `cost`; the full record is free through `get_contents` with its `id`. Present when the search that made the record fetched it, in both views and on `get_search`'s first page. */
    contents?: GetClean.ContentsCompact | undefined;
}

export namespace Candidate {
    /** Why this item is not a lead, one of the member names of `DroppedCounts`. A closed set. Absent on a lead; set on an item of a later page of `get_search`. */
    export const DroppedReason = {
        NotRelevant: "not_relevant",
        Undated: "undated",
        MaxPerDomain: "max_per_domain",
        BlockedDomain: "blocked_domain",
        OutsideAllowed: "outside_allowed",
        SourceKind: "source_kind",
        SourceIndependence: "source_independence",
        FoldedCopy: "folded_copy",
        PhraseCheck: "phrase_check",
        ExclusionCheck: "exclusion_check",
        BeyondMaxCandidates: "beyond_max_candidates",
    } as const;
    export type DroppedReason = (typeof DroppedReason)[keyof typeof DroppedReason];
}
