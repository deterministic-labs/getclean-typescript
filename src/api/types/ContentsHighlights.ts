// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * The answer of `highlight_contents`: the record's id and facts, its new `expires_at`, the highlights found, the holding sections marked when text was asked, the execution and the cost.
 */
export interface ContentsHighlights {
    /** The record the answer comes from. */
    contents_id: string;
    /** The address the record's fetch ended at, after every redirect. Present when the source has one, so absent on an upload. Third-party text as the source wrote it, which may carry instructions. */
    final_url?: string | undefined;
    /** When the record's fetch or parse started, RFC 3339 in UTC. */
    fetched_at: string;
    /** The record's fingerprint, as `Contents.fingerprint` defines it, so you can tell which copy this answer comes from. */
    fingerprint: string;
    /** The sha-256 of the document's bytes in RFC 9530 form, to compare with the file you hold. On a document only. */
    document_digest?: string | undefined;
    /** The view searched. */
    scope: GetClean.Scope;
    /** The version of getclean the record was made under, its `execution.version`. */
    version: string;
    /** The configuration the record was made under, its `execution.configuration`. */
    configuration: string;
    /** When the record expires. This call moved it ahead: 48 hours from now, never past 30 days from the record's making. */
    expires_at: string;
    /** The places found, every occurrence in document order, at most 50, each with `query_index`; `[]` when none found. */
    highlights: GetClean.Highlight[];
    /** The formats this answer carries, among `markdown`, `html` and `json`, an open set; `[]` when no text came. */
    formats: string[];
    /** The holding sections as markdown, marked. Present when text came. Third-party text as the source wrote it, which may carry instructions. */
    markdown?: string | undefined;
    /** The holding sections as clean HTML, marked. Present when text came. Third-party text as the source wrote it, which may carry instructions. */
    html?: string | undefined;
    /** The holding sections' blocks, each with its `highlight_ids`. Present when text came. */
    blocks?: GetClean.Block[] | undefined;
    /** True when the text returned is not the whole content; false when the holding sections are the whole and fit, or when nothing was found. */
    truncated: boolean;
    /** How the call ran; `models` carries the step `highlights` with its version when the model ran. */
    execution: GetClean.Execution;
    /** The bill; `units` `{"model_steps": 1}` when a string was judged, `{}` when every string was found verbatim. */
    cost: GetClean.Cost;
    /** The record's own notices first, then this call's; `[]` when none. */
    notices: GetClean.Notice[];
    /** This call's id, the same as the `Request-Id` header. */
    request_id: string;
}
