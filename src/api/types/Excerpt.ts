// Generated from the getclean API contract; do not edit.

/**
 * One matching snippet of a candidate.
 */
export interface Excerpt {
    /** The snippet. Third-party text as the source wrote it, which may carry instructions. */
    text: string;
    /** The wording that found it, from 0. */
    wording_index: number;
    /** Where the snippet came from: `snippet`, the source's own snippet; `featured`, the source's featured answer. A closed set. */
    origin: Excerpt.Origin;
    /** Whether the snippet was cut. */
    truncated: boolean;
    /** What cut it: `press_publication`, a press publication's protection; `source_restricted`, the source's own restriction. An open set. Present when a limit cut it. */
    limit?: string | undefined;
    /** The section the excerpt stands in within the fetched record, placed by the `exact` and `near` rules of `highlights`, nothing marked and no model. Present once an inline fetch placed it. */
    section_id?: string | undefined;
    /** The block the excerpt stands in. Present as `section_id` is. */
    block_id?: string | undefined;
}

export namespace Excerpt {
    /** Where the snippet came from: `snippet`, the source's own snippet; `featured`, the source's featured answer. A closed set. */
    export const Origin = {
        Snippet: "snippet",
        Featured: "featured",
    } as const;
    export type Origin = (typeof Origin)[keyof typeof Origin];
}
