// Generated from the getclean API contract; do not edit.

/**
 * An image in the content.
 */
export interface Image {
    /** Where to get the image: its own address as the page gives it, or a URL getclean serves for an image inside a document. Absent on a document's image under `retention` `none`. On a web image, third-party text as the source wrote it, which may carry instructions; on a document's image, getclean's own URL. */
    url?: string | undefined;
    /** The sha-256 of the image's bytes in RFC 9530 form, so two images can be told equal; null when the bytes were not loaded. */
    digest: string | null;
    /** The image's alternative text; null when it has none. Third-party text as the source wrote it, which may carry instructions. */
    alt: string | null;
    /** The caption the source ties to the image; null when there is none. Third-party text as the source wrote it, which may carry instructions. */
    caption: string | null;
    /** The width as the page shows it, in CSS pixels, rounded; the image's own pixel width in a document. */
    width_px: number;
    /** The height, measured as `width_px` is. */
    height_px: number;
}
