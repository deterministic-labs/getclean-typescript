// Generated from the getclean API contract; do not edit.

/**
 * One page read from its image, since it had no text layer.
 */
export interface RecognizedPage {
    /** The page, counted from 1. */
    page_number: number;
    /** How sure the recognition was of the page as a whole, 0 to 1. */
    confidence: number;
    /** A picture of the page, at a URL getclean serves for as long as the record lives, so you can check the reading against the image. Absent under `retention` `none`. */
    image_url?: string | undefined;
}
