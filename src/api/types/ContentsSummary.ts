// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * The answer of `summarize_contents`: the record's id and facts, its new `expires_at`, the summary, the execution and the cost.
 */
export interface ContentsSummary {
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
    /** The view summarized. */
    scope: GetClean.Scope;
    /** The version of getclean the record was made under, its `execution.version`. */
    version: string;
    /** The configuration the record was made under, its `execution.configuration`. */
    configuration: string;
    /** When the record expires. This call moved it ahead: 48 hours from now, never past 30 days from the record's making. */
    expires_at: string;
    /** The model's summary, at most 1,500 characters, in the content's language, with no link and no image markup; an empty string when no block was read. Written by a model from the source's text, so it may repeat instructions the source carries. */
    summary: string;
    /** How the call ran; `models` carries the step `summary` with its version when the step ran. */
    execution: GetClean.Execution;
    /** The bill; `units` `{"model_steps": 1}`, or `{}` when no block was read and the step did not run. */
    cost: GetClean.Cost;
    /** The record's own notices first, then this call's; `[]` when none. */
    notices: GetClean.Notice[];
    /** This call's id, the same as the `Request-Id` header. */
    request_id: string;
}
