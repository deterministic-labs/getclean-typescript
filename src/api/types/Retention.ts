// Generated from the getclean API contract; do not edit.

/** How long a record is kept; `hold`, 48 hours after its last call and at most 30 days from its making, or `none`, nothing kept past the answer. A closed set. */
export const Retention = {
    Hold: "hold",
    None: "none",
} as const;
export type Retention = (typeof Retention)[keyof typeof Retention];
