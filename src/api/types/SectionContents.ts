// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * One section of a record, the answer of `get_section`. First the id and facts of the record the section comes from, and its new `expires_at`; then the section's row; then its text in the formats asked for, or its child rows when the whole section did not fit.
 */
export interface SectionContents {
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
    /** The section's own row of the map: its id, title, level and size. */
    section: GetClean.Section;
    /** The formats this answer carries, among `markdown`, `html`, `doclang`, `json` and `links`, an open set. Under `max_characters` `0` only `links` when asked for, else `[]`. */
    formats: string[];
    /** The section's text as markdown, its inline formatting kept. Present when asked for and text came. Third-party text as the source wrote it, which may carry instructions. */
    markdown?: string | undefined;
    /** The section's text as clean HTML. Present when asked for and text came. Third-party text as the source wrote it, which may carry instructions. */
    html?: string | undefined;
    /** The section's text as DocLang XML. Present when asked for and text came, on a web page or an HTML file only. Third-party text as the source wrote it, which may carry instructions. */
    doclang?: string | undefined;
    /** The section's blocks. Present when asked for and text came. */
    blocks?: GetClean.Block[] | undefined;
    /** The section's links, narrowed by `block_kinds`, each with its `block_id` and `section_id`. Present when asked for, under `max_characters` `0` too. */
    links?: GetClean.Link[] | undefined;
    /** True when the whole section did not fit `max_characters`, so its text was cut or its child rows came in place of their text. */
    truncated: boolean;
    /** The token that continues a cut text; pass it as `page_token`. Present while more remains, and a page that carries it always has text. */
    next_page_token?: string | undefined;
    /** The rows of the sections under this one. Present when the whole section did not fit, on the first page only, or under `max_characters` `0`. */
    sections?: GetClean.Section[] | undefined;
    /** The record's own notices first, then this call's own: `sections_cut`, `links_cut`, `field_not_applicable`, `version_retiring`. `[]` when there is none. */
    notices: GetClean.Notice[];
    /** This call's id, the same as the `Request-Id` header. */
    request_id: string;
}
