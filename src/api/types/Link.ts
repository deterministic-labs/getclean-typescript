// Generated from the getclean API contract; do not edit.

/**
 * One link in the content, with its kind and where it stands.
 */
export interface Link {
    /** The address, absolute. Third-party text as the source wrote it, which may carry instructions. */
    url: string;
    /** The link's text; an empty string when it has none. Third-party text as the source wrote it, which may carry instructions. */
    text: string;
    /** What the link points to, read from its address alone, so a guess: `page`, another page; `file`, a file such as a PDF; `fragment`, a place on this page; `mail`, an email address; `phone`, a phone number; `feed`, an RSS or Atom feed; `other`, anything else. An open set. No request is made per link, so a link carries no size or served type. */
    kind: string;
    /** True when the link leaves the site, judged against the final URL's registrable domain. Absent on kinds without a host. */
    external?: boolean | undefined;
    /** The block a `fragment` link points to. Present when it resolves inside the record. */
    target_block_id?: string | undefined;
    /** The block that holds the link. Present everywhere but inside `Block.links`, where the block itself says it. */
    block_id?: string | undefined;
    /** The section that holds the link. Present everywhere but inside `Block.links`. */
    section_id?: string | undefined;
}
