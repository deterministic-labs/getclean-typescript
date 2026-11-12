// Generated from the getclean API contract; do not edit.

/**
 * One version of the question sent to the sources.
 */
export interface Wording {
    /** The wording's position, from 0. */
    index: number;
    /** The wording as it ran. */
    text: string;
    /** The wording's language, a BCP 47 tag. */
    language: string;
    /** How the language was known: `declared` by you, or `detected`. A closed set. */
    language_basis: Wording.LanguageBasis;
    /** Where the wording came from: `caller`, your `query`; `alternate`, one of your `alternate_queries`; `or_split`, one side of an OR in the question; `identifier`, an identifier's value; `engine_correction`, a correction getclean made. A closed set. */
    origin: Wording.Origin;
    /** What was corrected, `spelling`; an open set. Present with origin `engine_correction`. */
    correction_kind?: string | undefined;
    /** How many results each source gave this wording, keyed by datasource id. */
    result_counts: Record<string, number>;
}

export namespace Wording {
    /** How the language was known: `declared` by you, or `detected`. A closed set. */
    export const LanguageBasis = {
        Declared: "declared",
        Detected: "detected",
    } as const;
    export type LanguageBasis = (typeof LanguageBasis)[keyof typeof LanguageBasis];
    /** Where the wording came from: `caller`, your `query`; `alternate`, one of your `alternate_queries`; `or_split`, one side of an OR in the question; `identifier`, an identifier's value; `engine_correction`, a correction getclean made. A closed set. */
    export const Origin = {
        Caller: "caller",
        Alternate: "alternate",
        OrSplit: "or_split",
        Identifier: "identifier",
        EngineCorrection: "engine_correction",
    } as const;
    export type Origin = (typeof Origin)[keyof typeof Origin];
}
