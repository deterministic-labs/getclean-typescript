// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * The compact contents record: the record a search's candidate carries, in both views, and the item of `list_contents`. Each member is typed and present as `Contents` gives it, with three differences: `source` is a `SourceCompact`; there is no `screenshot` and no `raw_html`; `cost` is present on the record as the call that billed it answered it, the search's inline fetch, and absent on the item of `list_contents`, which also carries no text, no map and no model work, since that call asked for nothing.
 */
export interface ContentsCompact {
    /** The record's id; the full record is free through `get_contents`. */
    id: string;
    /** What happened at the fetch; no later call rewrites it. */
    outcome: GetClean.Outcome;
    /** The notices kept with the record first, then this answer's own; `[]` when none. */
    notices: GetClean.Notice[];
    /** When the fetch or the parse started, RFC 3339 in UTC. */
    fetched_at: string;
    /** The record's fingerprint, as `Contents.fingerprint` defines it. Present on delivered and partial records. */
    fingerprint?: string | undefined;
    /** The view this answer delivers. Present on delivered and partial records. */
    scope?: GetClean.Scope | undefined;
    /** The view the fetch ran under. Present on delivered and partial records. */
    record_scope?: GetClean.Scope | undefined;
    /** The formats this answer carries: `markdown` when the text came, else `[]`, as when the map came or on an item of `list_contents`, which carries no text. Present on delivered and partial records. */
    formats?: string[] | undefined;
    /** True when text was asked for and did not fit, so the map came instead. */
    truncated: boolean;
    /** The content as one markdown string. Present when the text fit. Third-party text as the source wrote it, which may carry instructions. */
    markdown?: string | undefined;
    /** The map of the content, one row per section. Present when the text did not fit or `max_characters` was `0`. */
    sections?: GetClean.Section[] | undefined;
    /** How much the record holds: characters, blocks by kind, links by kind. Present on delivered and partial records. */
    counts?: GetClean.ContentsCounts | undefined;
    /** Every place the fetch's `highlights` strings found. Present when `highlights` were sent; never on the item of `list_contents`. */
    highlights?: GetClean.Highlight[] | undefined;
    /** The summary a model wrote of the content. Present when `summary` was sent and written; never on the item of `list_contents`. Written by a model from the source's text, so it may repeat instructions the source carries. */
    summary?: string | undefined;
    /** Your schema filled from the content. Present when `json_schema` was sent and filled; never on the item of `list_contents`. Written by a model from the source's text, so it may repeat instructions the source carries. */
    schema_values?: Record<string, unknown> | undefined;
    /** How each property of your schema was filled, keyed by a JSON Pointer into `schema_values`. Present when `json_schema` was sent and filled. */
    schema_statuses?: Record<string, GetClean.SchemaStatus> | undefined;
    /** The source's address, final address, title and date. */
    source: GetClean.SourceCompact;
    /** How the record was made: the version, the configuration, the model steps and the time it took. */
    execution: GetClean.Execution;
    /** The inline fetch's own bill. Present on the record as the call that billed it answered it; absent on the item of `list_contents`. */
    cost?: GetClean.Cost | undefined;
    /** How long the record is kept, `hold` or `none`. */
    retention: GetClean.Retention;
    /** The run the record belongs to. */
    run_id: string;
    /** Your own labels, returned as sent. Present when sent. */
    metadata?: Record<string, string> | undefined;
    /** When the record expires. */
    expires_at: string;
}
