// Generated from the getclean API contract; do not edit.

/**
 * One operator read from the question.
 */
export interface QueryOperator {
    /** Which operator: `phrase`, `exclusion`, `or`, `site`, `filetype`, `intitle`, `inurl`, `before`, `after` or `wildcard`; an open set. */
    name: string;
    /** The operand as written. */
    value: string;
    /** The request field the operator was read into, `allowed_domains` for `site:`, `media_types` for `filetype:`, `published_from` and `published_until` for `after:` and `before:`. Present when there is one. */
    field?: string | undefined;
}
