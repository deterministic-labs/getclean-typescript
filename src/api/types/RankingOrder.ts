// Generated from the getclean API contract; do not edit.

/** The order within each priority group; `relevance`, `newest` or `oldest`. A closed set. */
export const RankingOrder = {
    Relevance: "relevance",
    Newest: "newest",
    Oldest: "oldest",
} as const;
export type RankingOrder = (typeof RankingOrder)[keyof typeof RankingOrder];
