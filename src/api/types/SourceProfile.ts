// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * Who publishes the source, as getclean identifies it from the site's own declarations and from public registries: no score, no tier, no verdict. Identifying a publisher costs nothing extra; when getclean identifies one during the call, the step `source_profile` is listed in `execution.models`. Under `deterministic_only` only what is already known answers. A kind that cannot be read from the declarations is `unknown`, never a guess.
 */
export interface SourceProfile {
    /** The kind of publisher; an open set with these published values, by sector. Public: `state`, `court`, `regulator`, `statistics_office`, `intergovernmental`, `standards_body`. Knowledge: `academic`, `scholarly_publisher`, `archive`, `reference`. Media: `press`, `information_provider`. Economy: `company`, `professional_practice`, `trade_body`, `marketplace`. Society: `civil_society`, `political`, `religious`, `education`, `healthcare`, `cultural`. Individual: `individual`, `community`. And `unknown`. */
    kind: string;
    /** What the item is as a source: `primary`, `secondary` or `tertiary` in the usual sense of research, else `unknown`. Read from the item's declared type first, then from the publisher's kind. A closed set. */
    role: SourceProfile.Role;
    /** Whether the publisher is the subject speaking about itself, `self`, or independent of it, `independent`, known through the subject's identifiers; else `unknown`. A closed set. */
    independence: SourceProfile.Independence;
    /** Who reviewed the publication, from the venue's stated process or a named validator. */
    review: GetClean.Review;
}

export namespace SourceProfile {
    /** What the item is as a source: `primary`, `secondary` or `tertiary` in the usual sense of research, else `unknown`. Read from the item's declared type first, then from the publisher's kind. A closed set. */
    export const Role = {
        Primary: "primary",
        Secondary: "secondary",
        Tertiary: "tertiary",
        Unknown: "unknown",
    } as const;
    export type Role = (typeof Role)[keyof typeof Role];
    /** Whether the publisher is the subject speaking about itself, `self`, or independent of it, `independent`, known through the subject's identifiers; else `unknown`. A closed set. */
    export const Independence = {
        Self: "self",
        Independent: "independent",
        Unknown: "unknown",
    } as const;
    export type Independence = (typeof Independence)[keyof typeof Independence];
}
