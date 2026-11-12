// Generated from the getclean API contract; do not edit.

/**
 * From where the site was read: the country, the language asked for and the kind of network.
 */
export interface Visitor {
    /** The country the site was read from, ISO 3166-1 alpha-2. */
    country: string;
    /** The language asked of the site, as the `Accept-Language` header sent. */
    language: string;
    /** The kind of network the site was read from, an open set: `datacenter`, `residential`, `mobile`. */
    network: string;
}
