// Generated from the getclean API contract; do not edit.

/**
 * How much a record holds under one view: characters, blocks by kind and links by kind.
 */
export interface ContentsCounts {
    /** The content's text in characters. */
    characters: number;
    /** How many blocks of each kind, keyed by kind: `text`, `heading`, `code`, `math`, `divider`, `interactive`, `table`, `image`, `embed`, `media`, an open set. `{}` when there is none. */
    blocks: Record<string, number>;
    /** How many links of each kind, keyed by kind: `page`, `file`, `fragment`, `mail`, `phone`, `feed`, `other`, an open set. `{}` when there is none. */
    links: Record<string, number>;
}
