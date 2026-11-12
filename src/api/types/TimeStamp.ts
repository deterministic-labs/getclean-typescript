// Generated from the getclean API contract; do not edit.

/**
 * Proof that the record existed at a moment: an RFC 3161 time-stamp token over one datum, the sha-256 of the record's fingerprint followed by the screenshot's digest, or of the fingerprint alone when no screenshot was made.
 */
export interface TimeStamp {
    /** The token, in base64. */
    token: string;
    /** The name of the time-stamping authority that issued it. */
    authority: string;
}
