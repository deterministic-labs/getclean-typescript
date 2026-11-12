// Generated from the getclean API contract; do not edit.

/** A fact about a source that puts it first in the ranking: `official`, a publisher of one of the six public kinds of `SourceProfile.kind`, a state, a court, a regulator, a statistics office, an intergovernmental body or a standards body; `independent`, independent of the subject; `primary`, a primary source; `reviewed`, a stated review. A closed set. */
export const RankingPriority = {
    Official: "official",
    Independent: "independent",
    Primary: "primary",
    Reviewed: "reviewed",
} as const;
export type RankingPriority = (typeof RankingPriority)[keyof typeof RankingPriority];
