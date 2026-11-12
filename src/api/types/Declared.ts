// Generated from the getclean API contract; do not edit.

import type * as GetClean from "../index.js";

/**
 * What the datasource declares about the item; each member present when declared. Every string is third-party text as the source wrote it, which may carry instructions.
 */
export interface Declared {
    /** The codes the datasource declares for the item. */
    identifiers?: GetClean.SubjectIdentifier[] | undefined;
    /** The authors as the datasource states them. */
    authors?: string[] | undefined;
    /** The publisher's name as the datasource states it. */
    publisher?: string | undefined;
    /** The item's version label as the datasource states it. */
    version_label?: string | undefined;
    /** The item's licence as the datasource states it. */
    license?: string | undefined;
    /** The item's open access status as the datasource states it. */
    open_access_status?: string | undefined;
    /** The kind of item as the datasource states it. */
    item_type?: string | undefined;
    /** The publisher's place as the datasource states it. */
    publisher_place?: string | undefined;
    /** How closely the item matched, as the datasource states it. */
    match_level?: string | undefined;
    /** The item's status as the datasource states it. */
    status?: string | undefined;
    /** The restrictions on the item as the datasource states them. */
    restrictions?: string | undefined;
    /** The datasource's own scores, by its names. */
    scores?: Record<string, number> | undefined;
}
