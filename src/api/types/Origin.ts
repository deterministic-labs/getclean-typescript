// Generated from the getclean API contract; do not edit.

/**
 * One other site the page reached while it was read.
 */
export interface Origin {
    /** The site, as scheme and host. Third-party text as the source wrote it, which may carry instructions. */
    origin: string;
    /** How it was reached, an open set: `form_action`, a form posts to it; `script`, a script was loaded from it; `frame`, a frame came from it; `fetch`, the page fetched data from it; `other`. */
    kind: string;
}
