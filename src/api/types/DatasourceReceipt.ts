// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * What ran on one source and what came back: the wordings, the counts, the fate of every filter and operator, the access used and this source's share of the cost.
 */
export interface DatasourceReceipt {
    /** The source's id in the catalog. */
    id: string;
    /** The source's display name in the catalog. */
    display_name: string;
    /** The group the source belongs to, `web` or a group the catalog publishes; an open set. */
    group: string;
    /** Why this source ran. A closed set: `named`, you named it in `datasources`; `identifier`, it resolves a scheme of the identifiers you sent; `group`, you named its group; `set`, you named a set that holds it; `discovered`, the choice of sources added it; `default`, `web` run when `datasources` named nothing. */
    reason: DatasourceReceipt.Reason;
    /** What happened on this source; a source's failure is never an API problem. */
    outcome: GetClean.Outcome;
    /** What the source states it covers, in its own words. Present when it states any. Third-party text as the source wrote it, which may carry instructions. */
    coverage?: string | undefined;
    /** How current the source says its index is. Present when it says. */
    current_at?: string | undefined;
    /** The country as sent to this source, ISO 3166-1 alpha-2. Present when the source takes it. */
    effective_country?: string | undefined;
    /** The language as sent to this source, a BCP 47 tag. Present when the source takes it. */
    effective_language?: string | undefined;
    /** The wordings run on this source, by their indexes. */
    wordings: number[];
    /** How many results the source returned. */
    returned_count: number;
    /** How many results the source says it has in all; null when `result_count_kind` is `unknown`. */
    result_count: number | null;
    /** How to read `result_count`: `exact`, `estimate`, `lower_bound` or `unknown`. A closed set. */
    result_count_kind: DatasourceReceipt.ResultCountKind;
    /** The leads this source gave. */
    lead_count: number;
    /** The fate of every hard filter on this source. */
    filters_applied: GetClean.FiltersApplied;
    /** The fate of every operator on this source. */
    operators_applied: GetClean.OperatorsApplied;
    /** The source's own settings left in force, as the source names them. Present when any. Third-party text as the source wrote it, which may carry instructions. */
    source_defaults?: Record<string, string> | undefined;
    /** The access the query ran under: `open`, `registered` or `paid`; an open set. */
    access_used: string;
    /** What the source charged for this query, also carried in this receipt's `cost.source_price` and summed into the search's. Present when the source charged. */
    fee?: GetClean.Money | undefined;
    /** The source's own results page for the first wording. Present when it offers one. Third-party text as the source wrote it, which may carry instructions. */
    results_page_url?: string | undefined;
    /** The source's own words for a refusal. Present on `not_accepted_by_source`. Third-party text as the source wrote it, which may carry instructions. */
    source_text?: string | undefined;
    /** This source's share. */
    cost: GetClean.Cost;
}

export namespace DatasourceReceipt {
    /** Why this source ran. A closed set: `named`, you named it in `datasources`; `identifier`, it resolves a scheme of the identifiers you sent; `group`, you named its group; `set`, you named a set that holds it; `discovered`, the choice of sources added it; `default`, `web` run when `datasources` named nothing. */
    export const Reason = {
        Named: "named",
        Identifier: "identifier",
        Group: "group",
        Set: "set",
        Discovered: "discovered",
        Default: "default",
    } as const;
    export type Reason = (typeof Reason)[keyof typeof Reason];
    /** How to read `result_count`: `exact`, `estimate`, `lower_bound` or `unknown`. A closed set. */
    export const ResultCountKind = {
        Exact: "exact",
        Estimate: "estimate",
        LowerBound: "lower_bound",
        Unknown: "unknown",
    } as const;
    export type ResultCountKind = (typeof ResultCountKind)[keyof typeof ResultCountKind];
}
