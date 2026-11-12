// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * What ordered the list, each as applied.
 */
export interface Ranking {
    /** Whether the ranking model ran. */
    reranked: boolean;
    /** The ranking model's version. Present only when it ran; absent under `deterministic_only` and on `rerank_missing`. */
    reranker_version?: string | undefined;
    /** The ranking model's cut-off, 0 to 1. Present only when it ran. */
    min_score?: number | undefined;
    /** Whether `ranking_instructions` were applied. */
    instructions_applied: boolean;
    /** The `ranking_priorities` applied; `[]` when none. */
    priorities: GetClean.RankingPriority[];
    /** The `ranking_order` applied. */
    order: GetClean.RankingOrder;
    /** The `ranking_preferred_domains` applied; `[]` when none. */
    preferred_domains: string[];
    /** The `ranking_max_per_domain` applied. Present when set. */
    max_per_domain?: number | undefined;
    /** How the sources' lists were merged into one; a closed set with one value. */
    merge: Ranking.Merge;
    /** One entry per source and language that took part in the merge, with the leads each gave. */
    strata: GetClean.Stratum[];
}

export namespace Ranking {
    /** How the sources' lists were merged into one; a closed set with one value. */
    export const Merge = {
        StratifiedRankFusion: "stratified_rank_fusion",
    } as const;
    export type Merge = (typeof Merge)[keyof typeof Merge];
}
