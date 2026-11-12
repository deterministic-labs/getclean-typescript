// Generated from the getclean API contract; do not edit.

import type * as core from "../core/index.js";
import { toJson } from "../core/json.js";

export class GetCleanError extends Error {
    public readonly statusCode?: number | undefined;
    public readonly body?: unknown;
    public readonly rawResponse?: core.RawResponse | undefined;
    public readonly cause?: unknown;

    constructor({
        message,
        statusCode,
        body,
        rawResponse,
        cause,
    }: {
        message?: string | undefined;
        statusCode?: number | undefined;
        body?: unknown;
        rawResponse?: core.RawResponse | undefined;
        cause?: unknown;
    }) {
        super(buildMessage({ message, statusCode, body }));
        Object.setPrototypeOf(this, new.target.prototype);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }

        this.name = "GetCleanError";
        this.statusCode = statusCode;
        this.body = body;
        this.rawResponse = rawResponse;
        if (cause != null) {
            this.cause = cause;
        }
    }

    public get requestId(): string | undefined {
        const headers = this.rawResponse?.headers;
        if (headers == null) {
            return undefined;
        }
        const requestId = headers.get("X-Request-Id");
        if (requestId != null) {
            return requestId;
        }
        let fallback: string | undefined;
        headers.forEach((value, name) => {
            if (fallback === undefined && /request[-_]?id$/i.test(name)) {
                fallback = value;
            }
        });
        return fallback;
    }
}

function buildMessage({
    message,
    statusCode,
    body,
}: {
    message: string | undefined;
    statusCode: number | undefined;
    body: unknown | undefined;
}): string {
    const lines: string[] = [];
    const problem = getProblemDescription(body);
    if (problem != null) {
        lines.push(problem);
    } else if (message != null) {
        lines.push(message);
    }

    if (statusCode != null) {
        lines.push(`Status code: ${statusCode.toString()}`);
    }

    if (body != null) {
        lines.push(`Body: ${toJson(body, undefined, 2)}`);
    }

    return lines.join("\n");
}

/**
 * The problem a response body describes as RFC 9457 problem details do: its `title` and its `detail`, joined by a
 * colon, or the one of them it carries. Undefined for a body that carries neither.
 */
function getProblemDescription(body: unknown): string | undefined {
    if (typeof body !== "object" || body == null) {
        return undefined;
    }
    const title = "title" in body && typeof body.title === "string" && body.title.length > 0 ? body.title : undefined;
    const detail =
        "detail" in body && typeof body.detail === "string" && body.detail.length > 0 ? body.detail : undefined;
    if (title != null && detail != null) {
        return `${title}: ${detail}`;
    }
    return title ?? detail;
}
