// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * One page of a record's links, the answer of `list_links`. First the record's id and facts, and the record's new `expires_at`; then the links, each with its kind and its place; then `next_page_token` while more remain.
 */
export interface LinkPage {
    /** The record the answer comes from. */
    contents_id: string;
    /** The address the record's fetch ended at. Present when the source has one, so absent on an upload. Third-party text as the source wrote it, which may carry instructions. */
    final_url?: string | undefined;
    /** When the record's fetch or parse started, RFC 3339 in UTC. */
    fetched_at: string;
    /** The record's fingerprint, as `Contents.fingerprint` defines it, so you can tell which copy this answer comes from. */
    fingerprint: string;
    /** The sha-256 of the document's bytes in RFC 9530 form, to compare with the file you hold. On a document only. */
    document_digest?: string | undefined;
    /** The view this answer delivers, `main` or `whole_page`. */
    scope: GetClean.Scope;
    /** The version of getclean the record was made under, its `execution.version`. */
    version: string;
    /** The configuration the record was made under, its `execution.configuration`. */
    configuration: string;
    /** When the record expires. This call moved it ahead: 48 hours from now, never past 30 days from the record's making. */
    expires_at: string;
    /** The links of this page, each with its kind and its `block_id` and `section_id`; `[]` when none matches. */
    links: GetClean.Link[];
    /** The token for the next page; pass it as `page_token`. Present while more remains, and a page that carries it always has at least one link. */
    next_page_token?: string | undefined;
    /** The record's own notices first, then this call's own: `page_size_lowered`, `field_not_applicable`, `version_retiring`. `[]` when there is none. */
    notices: GetClean.Notice[];
    /** This call's id, the same as the `Request-Id` header. */
    request_id: string;
}
