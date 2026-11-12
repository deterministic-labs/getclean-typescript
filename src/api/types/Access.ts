// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * What a page demands, as the search saw it without a fetch.
 */
export interface Access {
    /** What the page demands: `open`, nothing; `paywall`, a purchase; `sign_in`, a sign-in; `blocked`, it refuses the visitor; `unknown`. A closed set. */
    kind: Access.Kind;
    /** The price the page states. Present when known. */
    price?: GetClean.Money | undefined;
    /** The signals the search saw without a fetch; `[]` when none. */
    declared_terms: GetClean.DeclaredTerm[];
    /** What the site's robots file says for getclean by its published name: `allowed`, `disallowed`, `absent`, `unreachable` or `not_applicable`; an open set. */
    robots: string;
}

export namespace Access {
    /** What the page demands: `open`, nothing; `paywall`, a purchase; `sign_in`, a sign-in; `blocked`, it refuses the visitor; `unknown`. A closed set. */
    export const Kind = {
        Open: "open",
        Paywall: "paywall",
        SignIn: "sign_in",
        Blocked: "blocked",
        Unknown: "unknown",
    } as const;
    export type Kind = (typeof Kind)[keyof typeof Kind];
}
