// Generated from the getclean API contract; do not edit.

import { BearerAuthProvider } from "./auth/BearerAuthProvider.js";
import { mergeHeaders } from "./core/headers.js";
import * as core from "./core/index.js";
import type * as environments from "./environments.js";

export type AuthOption =
    | false
    | core.AuthProvider["getAuthRequest"]
    | core.AuthProvider
    | BearerAuthProvider.AuthOptions;

export type BaseClientOptions = {
    environment?: core.Supplier<environments.GetCleanEnvironment | string> | undefined;
    /** Specify a custom URL to connect the client to. */
    baseUrl?: core.Supplier<string> | undefined;
    /** Identifies the calling application. Its product token is appended to the User-Agent header sent by the SDK. */
    appInfo?: { name: string; version?: string | undefined; comment?: string | undefined } | undefined;
    /** Additional headers to include in requests. */
    headers?: Record<string, string | core.Supplier<string | null | undefined> | null | undefined> | undefined;
    /** The default maximum time to wait for a response in seconds. */
    timeoutInSeconds?: number | undefined;
    /** The default number of times to retry the request. Defaults to 4. */
    maxRetries?: number | undefined;
    /** Provide a custom fetch implementation. Useful for platforms that don't have a built-in fetch or need a custom implementation. */
    fetch?: typeof fetch | undefined;
    /** Configure logging for the client. */
    logging?: core.logging.LogConfig | core.logging.Logger | undefined;
    /** Default options for SSE stream reconnection behavior. Has no effect on non-resumable endpoints. */
    stream?: { reconnectionEnabled?: boolean | undefined; maxReconnectionAttempts?: number | undefined } | undefined;
    /** Override auth. Pass false to disable, a function returning auth headers, an AuthProvider, or auth options. */
    auth?: AuthOption | undefined;
} & BearerAuthProvider.AuthOptions;

export interface BaseRequestOptions {
    /** The maximum time to wait for a response in seconds. */
    timeoutInSeconds?: number | undefined;
    /** The number of times to retry the request. Defaults to the client's `maxRetries`. */
    maxRetries?: number | undefined;
    /** A hook to abort the request. */
    abortSignal?: AbortSignal | undefined;
    /** Additional query string parameters to include in the request. */
    queryParams?: Record<string, unknown> | undefined;
    /** A dictionary containing additional parameters to spread into the request's body. */
    additionalBodyParameters?: Record<string, unknown> | undefined;
    /** Additional headers to include in the request. */
    headers?: Record<string, string | core.Supplier<string | null | undefined> | null | undefined> | undefined;
    /** Options for SSE stream reconnection behavior. Has no effect on non-resumable endpoints. */
    stream?: { reconnectionEnabled?: boolean | undefined; maxReconnectionAttempts?: number | undefined } | undefined;
}

export type NormalizedClientOptions<T extends BaseClientOptions = BaseClientOptions> = T & {
    logging: core.logging.Logger;
    authProvider?: core.AuthProvider | undefined;
};

export type NormalizedClientOptionsWithAuth<T extends BaseClientOptions = BaseClientOptions> =
    NormalizedClientOptions<T> & {
        authProvider: core.AuthProvider;
    };

export function normalizeClientOptions<T extends BaseClientOptions = BaseClientOptions>(
    options: T,
): NormalizedClientOptions<T> {
    const headers = mergeHeaders(
        { "User-Agent": appendAppInfoToUserAgent(core.getUserAgent("getclean", "0.1.0"), options?.appInfo) },
        options?.headers,
    );

    const baseUrl =
        options?.baseUrl ??
        (options?.environment == null
            ? typeof process !== "undefined"
                ? process.env?.GETCLEAN_BASE_URL || undefined
                : undefined
            : undefined);

    return {
        ...options,
        baseUrl,
        logging: core.logging.createLogger(options?.logging),
        headers,
    } as NormalizedClientOptions<T>;
}

function appendAppInfoToUserAgent(
    userAgent: string,
    appInfo: { name: string; version?: string | undefined; comment?: string | undefined } | undefined,
): string {
    if (appInfo == null) {
        return userAgent;
    }
    const percentEncodeChar = (char: string): string => {
        let encoded = "";
        for (const byte of new TextEncoder().encode(char)) {
            encoded += `%${byte.toString(16).toUpperCase().padStart(2, "0")}`;
        }
        return encoded;
    };
    // RFC 7230 token = 1*tchar. Any character outside that set is percent-encoded so
    // it cannot break out of the product token or inject additional header content.
    const encodeToken = (value: string): string => value.replace(/[^!#$%&'*+\-.^_`|~0-9A-Za-z]/g, percentEncodeChar);
    // Escape the comment delimiters `(`, `)`, `\` and control characters (0x00-0x1F,
    // 0x7F, incl. CR/LF) so a caller-supplied comment cannot terminate the comment
    // group early or inject additional header content. Code points are compared rather
    // than matched with a regex range so the emitted code does not trip lint rules that
    // ban control characters in regular expressions.
    const encodeComment = (value: string): string =>
        Array.from(value)
            .map((char) => {
                const codePoint = char.codePointAt(0) ?? 0;
                return char === "(" || char === ")" || char === "\\" || codePoint <= 0x1f || codePoint === 0x7f
                    ? percentEncodeChar(char)
                    : char;
            })
            .join("");

    const name = encodeToken((appInfo.name ?? "").trim());
    if (name.length === 0) {
        return userAgent;
    }
    let productToken = name;
    const version = encodeToken((appInfo.version ?? "").trim());
    if (version.length > 0) {
        productToken += `/${version}`;
    }
    const comment = encodeComment((appInfo.comment ?? "").trim());
    if (comment.length > 0) {
        productToken += ` (${comment})`;
    }
    return `${userAgent} ${productToken}`;
}

export function normalizeClientOptionsWithAuth<T extends BaseClientOptions = BaseClientOptions>(
    options: T,
): NormalizedClientOptionsWithAuth<T> {
    const normalized = normalizeClientOptions(options) as NormalizedClientOptionsWithAuth<T>;

    if (options.auth === false) {
        normalized.authProvider = new core.NoOpAuthProvider();
        return normalized;
    }
    if (options.auth != null) {
        if (typeof options.auth === "function") {
            normalized.authProvider = { getAuthRequest: options.auth };
            return normalized;
        }
        if (core.isAuthProvider(options.auth)) {
            normalized.authProvider = options.auth;
            return normalized;
        }
        Object.assign(normalized, options.auth);
    }

    const normalizedWithNoOpAuthProvider = withNoOpAuthProvider(normalized);
    normalized.authProvider ??= BearerAuthProvider.createInstance(normalizedWithNoOpAuthProvider);
    return normalized;
}

function withNoOpAuthProvider<T extends BaseClientOptions = BaseClientOptions>(
    options: NormalizedClientOptions<T>,
): NormalizedClientOptionsWithAuth<T> {
    return {
        ...options,
        authProvider: new core.NoOpAuthProvider(),
    };
}
