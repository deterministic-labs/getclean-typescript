// Generated from the getclean API contract; do not edit.

/**
 * The page's bytes exactly as the server sent them, decompressed, before any script ran; on an archive copy, as the archive served them. The served bytes and their digest let you show later exactly what the server sent.
 */
export interface RawHtml {
    /** Where to get the bytes, a URL getclean serves for as long as the record lives, under `retention` `hold`. */
    url?: string | undefined;
    /** The bytes in base64, under `retention` `none`, where nothing is stored to serve; at most `bounds.contents.page_bytes`. Never altered by any client, since the digest covers the bytes as served. Third-party text as the source wrote it, which may carry instructions. */
    data_base64?: string | undefined;
    /** The sha-256 of the bytes in RFC 9530 form. */
    digest: string;
    /** How many bytes. */
    bytes: number;
    /** The `Content-Type` the server sent; null when none came. Third-party text as the source wrote it, which may carry instructions. */
    media_type: string | null;
}
