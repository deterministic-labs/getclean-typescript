// Generated from the getclean API contract; do not edit.

/**
 * The review a publication states about itself.
 */
export interface Review {
    /** The kind of review: `peer_reviewed`, `editorial`, `audited`, `externally_validated`, `none` or `unknown`. A closed set. */
    kind: Review.Kind;
    /** Who reviewed it; null when unknown. Third-party text as the source wrote it, which may carry instructions. */
    by: string | null;
}

export namespace Review {
    /** The kind of review: `peer_reviewed`, `editorial`, `audited`, `externally_validated`, `none` or `unknown`. A closed set. */
    export const Kind = {
        PeerReviewed: "peer_reviewed",
        Editorial: "editorial",
        Audited: "audited",
        ExternallyValidated: "externally_validated",
        None: "none",
        Unknown: "unknown",
    } as const;
    export type Kind = (typeof Kind)[keyof typeof Kind];
}
