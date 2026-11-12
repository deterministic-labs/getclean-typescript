// Generated from the getclean API contract; do not edit.

/**
 * One page that holds content the text cannot carry, with a picture of it.
 */
export interface PicturedPage {
    /** The page, counted from 1. */
    page_number: number;
    /** What the page holds, an open set: `handwriting`, `drawing`, `formula`, `redaction`. */
    kind: string;
    /** A picture of the page, at a URL getclean serves for as long as the record lives. Absent under `retention` `none`. */
    image_url?: string | undefined;
}
