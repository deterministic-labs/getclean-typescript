// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * The facts of the source and of the read. `title`, `authors`, `published_date`, `published_at`, `modified_date`, `publisher`, `canonical_url`, `language`, `language_versions`, `structured_data` and `declared_terms` are what the page or the document declares about itself; getclean reports them and does not check them against the content. The table under `Contents` says which of these members each kind of source carries.
 */
export interface Source {
    /** The address that was asked for; on an upload, the `captured_url` given. Absent on an upload sent without `captured_url`. On a record a search made, third-party text as the source wrote it, which may carry instructions. */
    url?: string | undefined;
    /** The address the fetch ended at, after every redirect. Absent on an upload. Third-party text as the source wrote it, which may carry instructions. */
    final_url?: string | undefined;
    /** Every redirect on the way, script and meta-refresh hops included; `[]` when there was none. */
    redirects: GetClean.Redirect[];
    /** The HTTP status of the final response. Absent when no response came, and on an upload. */
    status_code?: number | undefined;
    /** The `Content-Type` the server sent or, for an upload, the type read from the bytes; null when no response or no type came. Third-party text as the source wrote it, which may carry instructions. */
    media_type: string | null;
    /** The kind of source, an open set: `web`, a live page; `archive`, an archive's copy read under `as_of_date`; `upload`, bytes you sent. */
    carrier: string;
    /** The archive copy that was read, with the archive's name, the capture's time and its address. On an archive copy only. */
    archive?: GetClean.Archive | undefined;
    /** The archives of `Limits.archives` that answered the lookup, by name. On every fetch under `as_of_date`; one that did not answer is named by the notice `archive_unreachable`. */
    archives_consulted?: string[] | undefined;
    /** When the next capture after this one was taken, so an agent can step forward capture by capture. On a fetch under `as_of_date`, when a later capture exists. */
    next_capture_at?: string | undefined;
    /** The file's name as it was sent. On an upload only. */
    filename?: string | undefined;
    /** The sha-256 of the document's bytes in RFC 9530 form. Compare it with the file you hold to be sure the right document was parsed. On a document only. */
    document_digest?: string | undefined;
    /** The title as the source declares it; null when none came. Third-party text as the source wrote it, which may carry instructions. */
    title: string | null;
    /** The authors as the source declares them; `[]` when none. Third-party text as the source wrote it, which may carry instructions. */
    authors: string[];
    /** The publisher as the page declares it; null when not declared. Absent on an upload. Third-party text as the source wrote it, which may carry instructions. */
    publisher?: (string | null) | undefined;
    /** The address the publisher names as the original, as declared; null when not declared. Absent on an upload. Third-party text as the source wrote it, which may carry instructions. */
    canonical_url?: (string | null) | undefined;
    /** The date of publication as the source declares it, a full date; null when none. A document's own dates often record when the file was made. */
    published_date: string | null;
    /** How exact `published_date` is, `day`, `month` or `year`. Absent when the date is null. */
    published_date_precision?: GetClean.DatePrecision | undefined;
    /** Where the date was read, an open set: `structured_data`, `meta_tag`, `byline`, `url` or `document_properties`. Absent when the date is null. */
    published_date_basis?: string | undefined;
    /** The moment of publication in UTC. Present when the page states a time with its zone. */
    published_at?: string | undefined;
    /** The date of the last change as the source declares it, a full date; null when none. */
    modified_date: string | null;
    /** The language the page declares, as a BCP 47 tag; null when none came. Third-party text as the source wrote it, which may carry instructions. */
    language: string | null;
    /** The page's own versions in other languages, as it declares them; `[]` when it declares none. */
    language_versions: GetClean.LanguageVersion[];
    /** Who publishes the source, as getclean identifies it. On a web page, an archive copy or a document at a URL; absent on an upload. */
    profile?: GetClean.SourceProfile | undefined;
    /** The access the fetch ran under, an open set: `open`, no login; `registered`, a login registered for a datasource. Absent on an upload. */
    access_kind?: string | undefined;
    /** The datasource whose registered login served the fetch. Present when `access_kind` is `registered`. */
    datasource_id?: string | undefined;
    /** When you took the capture, as you stated it. On an upload sent with `captured_at` only. */
    captured_at?: string | undefined;
    /** What the site's robots file says for getclean by its published name, an open set: `allowed`, `disallowed`, `absent`, `unreachable`; `not_applicable` on an upload. */
    robots: string;
    /** The terms the source declares about its use, each as found and as read, reported and never judged; `[]` when none. */
    declared_terms: GetClean.DeclaredTerm[];
    /** The page's own structured data, its JSON-LD objects as stated, at most 64 KB together, cut with the notice `structured_data_cut`; `[]` when none. Third-party text as the source wrote it, which may carry instructions. */
    structured_data: Record<string, unknown>[];
    /** The other sites the page reached while it was read, each once, with how; `[]` when none. */
    origins: GetClean.Origin[];
    /** The notice page the site named in its `Link rel="blocked-by"` header. On a `legal_block` record only. Third-party text as the source wrote it, which may carry instructions. */
    blocked_by?: string | undefined;
    /** From where the site was read: the country, the language asked for and the kind of network. Absent on an archive copy or an upload. */
    visitor?: GetClean.Visitor | undefined;
}
