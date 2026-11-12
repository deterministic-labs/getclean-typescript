// Generated from the getclean API contract; do not edit.

/**
 * A picture of the whole page at the width it was read at, as PNG.
 */
export interface Screenshot {
    /** Where to get the picture, a URL getclean serves for as long as the record lives, under `retention` `hold`. */
    url?: string | undefined;
    /** The PNG bytes in base64, under `retention` `none`, where nothing is stored to serve; at most `bounds.contents.screenshot_bytes`. */
    data_base64?: string | undefined;
    /** The sha-256 of the PNG bytes in RFC 9530 form, so the picture can be proved unchanged. */
    digest: string;
    /** The width in pixels. */
    width_px: number;
    /** The height in pixels. */
    height_px: number;
}
