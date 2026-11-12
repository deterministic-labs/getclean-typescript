/**
 * The hand-written part of the getclean TypeScript SDK: what the generated client cannot do from the contract alone.
 *
 * The client in GetClean.ts uses these pieces: the timeout per attempt, read from getLimits before the first call that
 * may bill (the operation's own bound plus ten seconds, 120 seconds until read), and the rules of that reading; the key
 * left on every error a call that may bill raises; a document stream read into memory once before the first attempt;
 * the waits of the upload's wait helper between its tries of a poll or the read after a transient failure; the error
 * class a job's problem is raised as; the repeat filter over a pager whose list grows while it pages. The generated
 * runtime retries 429, 502, 503, 504 and a 409 whose problem type is idempotency-key-in-flight under one count of
 * attempts; the hand-written code adds no retry of its own.
 */

import * as api from "../api/index.js";
import type { GetClean as GeneratedGetClean } from "../Client.js";
import * as core from "../core/index.js";
import { GetCleanError, GetCleanTimeoutError } from "../errors/index.js";
import { PROBLEM_STATUS_BY_TYPE } from "./problemTypes.js";

/** The timeout per attempt: the operation's own bound plus the margin; 120 seconds until getLimits is read. */
export const TIMEOUT_UNTIL_LIMITS_READ_SECONDS = 120;
export const TIMEOUT_MARGIN_SECONDS = 10;
/** The wait helper gives a job the contents job_seconds bound and one more minute; 30 minutes until the bound is read. */
export const JOB_BOUND_UNTIL_LIMITS_READ_SECONDS = 1800;
export const JOB_BOUND_MARGIN_SECONDS = 60;
/**
 * The wait helper's wait before it tries a poll or the read again after a transient failure, each poll and the read being
 * one attempt: the server's wait when it sent one, else 1 second doubling each time, varied by up to 10 percent, never
 * past 30.
 */
export const HELPER_BACKOFF_FIRST_SECONDS = 1;
export const HELPER_BACKOFF_CAP_SECONDS = 30;
/** A limits read answered with one of these is not repeated: the key is unknown, or lacks the scope, for good. */
const REFUSED_FOR_THE_CLIENTS_LIFE: ReadonlySet<number> = new Set([401, 403]);
/** The runtime's own words for a request the caller aborted (core/fetcher); a wait of the wait helper ends the same way. */
const ABORTED_MESSAGE = "The user aborted a request";

export type Family = "contents" | "search";
/** The bound of the limits that times a call: the two batches run under batch_seconds, every other call under call_seconds. */
export type Bound = "call_seconds" | "batch_seconds";

/** The timeouts per operation, from the limits once they are read, and whether the limits can be read at all. */
export class Timeouts {
    private limits: api.Limits | undefined;
    private refusedForGood = false;

    public get read(): boolean {
        return this.limits != null;
    }

    /** Whether a limits read was refused for the client's life (a 401 or a 403), so it is not tried again. */
    public get refused(): boolean {
        return this.refusedForGood;
    }

    public take(limits: api.Limits): void {
        this.limits = limits;
    }

    public refuse(): void {
        this.refusedForGood = true;
    }

    private boundMax(family: Family, name: string): number | undefined {
        const bound = this.limits?.bounds?.[family]?.[name];
        return bound?.max ?? undefined;
    }

    /**
     * The timeout of one attempt of a call timed by this bound of the family: the bound plus the margin; 120 seconds
     * until the limits are read, or when they lack the bound.
     */
    public seconds(family: Family, bound: Bound): number {
        const limit = this.boundMax(family, bound);
        return limit == null ? TIMEOUT_UNTIL_LIMITS_READ_SECONDS : limit + TIMEOUT_MARGIN_SECONDS;
    }

    /** The wait helper's bound: the contents job_seconds bound plus a minute, 30 minutes plus a minute until read. */
    public jobSeconds(): number {
        const bound = this.boundMax("contents", "job_seconds");
        return (bound ?? JOB_BOUND_UNTIL_LIMITS_READ_SECONDS) + JOB_BOUND_MARGIN_SECONDS;
    }
}

/**
 * The caller's headers and abort signal alone, as the limits read a call that may bill causes and the polls and the
 * read of the wait helper carry them: none of the call's query, timeout or retry options go with them, and an abort
 * ends them with the call.
 */
export function carried(options: GeneratedGetClean.RequestOptions | undefined): GeneratedGetClean.RequestOptions {
    return { headers: options?.headers, abortSignal: options?.abortSignal };
}

/** Whether a failed limits read is one that would fail again for the client's life. */
export function refusedForGood(error: unknown): boolean {
    return (
        error instanceof GetCleanError && error.statusCode != null && REFUSED_FOR_THE_CLIENTS_LIFE.has(error.statusCode)
    );
}

/** Leaves the key the call carried on the error it raised, as `idempotencyKey`, so a repeat is a replay. */
export function withIdempotencyKey(error: unknown, key: string): void {
    if (error instanceof GetCleanError) {
        error.idempotencyKey = key;
    }
}

/** Leaves the last job the wait helper saw on the error that ended it, as `job`, so the caller holds its id. */
export function withJob(error: unknown, job: api.Job): void {
    if (error instanceof GetCleanError) {
        error.job = job;
    }
}

/** The wait the server asked for on a transient failure, from Retry-After, in seconds, never below zero. */
function retryAfterSeconds(error: GetCleanError): number | undefined {
    const header = error.rawResponse?.headers?.get("Retry-After");
    if (header == null) {
        return undefined;
    }
    const seconds = Number.parseFloat(header);
    return Number.isNaN(seconds) ? undefined : Math.max(seconds, 0);
}

/**
 * The seconds the wait helper waits before it tries a poll or the record's read again, or undefined when the failure
 * ends the helper.
 *
 * A 429, a 5xx, a timeout or a transport failure of a poll or the read, each one attempt, is a transient failure of a free
 * read that repeats without harm: the server's wait when it sent one, else the backoff with its jitter. A 4xx, an abort by
 * the caller, and any error raised before a request left end the helper as they arrived.
 */
export function helperWait(error: unknown, tries: number, abortSignal: AbortSignal | undefined): number | undefined {
    if (abortSignal?.aborted || !(error instanceof GetCleanError)) {
        return undefined;
    }
    const status = error.statusCode;
    if (status != null) {
        if (status !== 429 && status < 500) {
            return undefined;
        }
        const asked = retryAfterSeconds(error);
        if (asked != null) {
            return asked;
        }
    } else if (!(error instanceof GetCleanTimeoutError) && error.rawResponse == null) {
        // No request left: a missing credential, for one. The runtime marks a transport failure with its empty raw response.
        return undefined;
    }
    const backoff = HELPER_BACKOFF_FIRST_SECONDS * 2 ** tries;
    return Math.min(backoff * (0.9 + Math.random() * 0.2), HELPER_BACKOFF_CAP_SECONDS);
}

/**
 * Waits the seconds, or rejects as soon as the signal aborts, with the error the runtime raises for an aborted request;
 * the timer never keeps the process alive.
 */
export function sleep(seconds: number, abortSignal: AbortSignal | undefined): Promise<void> {
    return new Promise((resolve, reject) => {
        const aborted = (): GetCleanError =>
            new GetCleanError({ message: ABORTED_MESSAGE, cause: abortSignal?.reason });
        if (abortSignal?.aborted) {
            reject(aborted());
            return;
        }
        const onAbort = (): void => {
            clearTimeout(timer);
            reject(aborted());
        };
        const timer = setTimeout(() => {
            abortSignal?.removeEventListener("abort", onAbort);
            resolve();
        }, seconds * 1000);
        abortSignal?.addEventListener("abort", onAbort, { once: true });
    });
}

/**
 * A document given as a path names a file; when there is none, the platform's own error (its code ENOENT and the path)
 * is thrown before any request leaves, the limits read included, so a typo costs no request. Where the platform has no
 * file system, nothing is checked and the generated client answers as it does.
 */
export async function assertPathExists(document: core.file.Uploadable | undefined): Promise<void> {
    if (
        typeof document !== "object" ||
        document == null ||
        !("path" in document) ||
        typeof document.path !== "string"
    ) {
        return;
    }
    if (isNodeStream(document) || isWebStream(document)) {
        return;
    }
    let fs: typeof import("fs") | undefined;
    try {
        fs = await import("fs");
    } catch {
        return;
    }
    if (fs?.promises?.access == null) {
        return;
    }
    await fs.promises.access(document.path);
}

/** A list the upload sent, as the record's read after its job takes it: the list when it holds something, else nothing. */
export function sentList<T>(value: T[] | undefined): T[] | undefined {
    return value != null && value.length > 0 ? value : undefined;
}

type StreamLike = { pipe: (destination: unknown) => unknown; path?: unknown };
type WebStreamLike = {
    getReader: () => {
        read: () => Promise<{ done: boolean; value?: Uint8Array | undefined }>;
        releaseLock: () => void;
    };
};

function isNodeStream(value: unknown): value is StreamLike & AsyncIterable<Uint8Array | string> {
    return typeof value === "object" && value != null && "pipe" in value && typeof value.pipe === "function";
}

function isWebStream(value: unknown): value is WebStreamLike {
    return typeof value === "object" && value != null && "getReader" in value && typeof value.getReader === "function";
}

function concat(chunks: Uint8Array[]): Uint8Array {
    const whole = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
        whole.set(chunk, offset);
        offset += chunk.length;
    }
    return whole;
}

/** The bytes of a stream, read whole; undefined for a value that is not a stream. */
async function bytesOfStream(value: unknown): Promise<Uint8Array | undefined> {
    if (isNodeStream(value)) {
        const chunks: Uint8Array[] = [];
        for await (const chunk of value) {
            chunks.push(typeof chunk === "string" ? new TextEncoder().encode(chunk) : chunk);
        }
        return concat(chunks);
    }
    if (isWebStream(value)) {
        const reader = value.getReader();
        const chunks: Uint8Array[] = [];
        try {
            for (;;) {
                const { done, value: chunk } = await reader.read();
                if (done) {
                    break;
                }
                if (chunk != null) {
                    chunks.push(chunk);
                }
            }
        } finally {
            reader.releaseLock();
        }
        return concat(chunks);
    }
    return undefined;
}

/** The file's base name a stream opened from a path carries, as the generated client names such a stream. */
function nameOfStream(stream: StreamLike): string | undefined {
    if (stream.path == null) {
        return undefined;
    }
    const path = String(stream.path);
    const lastSlash = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
    return lastSlash >= 0 ? path.substring(lastSlash + 1) : path;
}

/**
 * The document with any stream in it read into memory once, before the first attempt, so every attempt of the call
 * sends the same bytes under the same key: a stream opened from a path keeps the file's name, as the generated client
 * names it; the other forms, bytes, a Blob, a File or a path, pass as they are, since the generated client sends them
 * whole on each attempt.
 */
export async function documentReadOnce(
    document: core.file.Uploadable | undefined,
): Promise<core.file.Uploadable | undefined> {
    if (document == null) {
        return document;
    }
    if (typeof document === "object" && "data" in document && !isNodeStream(document) && !isWebStream(document)) {
        const data = await bytesOfStream(document.data);
        return data == null ? document : { ...document, data };
    }
    const data = await bytesOfStream(document);
    if (data == null) {
        return document;
    }
    const filename = isNodeStream(document) ? nameOfStream(document) : undefined;
    return filename == null ? data : { data, filename };
}

type ErrorClass = new (body: api.Problem, rawResponse?: core.RawResponse) => GetCleanError;

let errorClassByStatus: Map<number, ErrorClass> | undefined;

/** The generated error class of each status, read from the classes themselves (the API's exports that extend the base error). */
function errorClasses(): Map<number, ErrorClass> {
    if (errorClassByStatus != null) {
        return errorClassByStatus;
    }
    const byStatus = new Map<number, ErrorClass>();
    const probe = {
        type: "about:blank",
        title: "",
        detail: "",
        instance: "",
        request_id: "",
        who_must_act: "caller",
        retryable: false,
    } as api.Problem;
    for (const value of Object.values(api as Record<string, unknown>)) {
        if (typeof value !== "function" || !(value.prototype instanceof GetCleanError)) {
            continue;
        }
        const errorClass = value as unknown as ErrorClass;
        const status = new errorClass(probe).statusCode;
        if (status != null) {
            byStatus.set(status, errorClass);
        }
    }
    errorClassByStatus = byStatus;
    return byStatus;
}

/**
 * The problem's status: its own when it carries one, else the status the contract gives its type (a problem nested in a
 * job carries no status; its type's last segment names the type, and problemTypes.ts, derived from the contract's table
 * when the SDK is built, gives the status).
 */
export function problemStatus(problem: api.Problem): number | undefined {
    if (problem.status != null) {
        return problem.status;
    }
    const name = problem.type.split("/").pop() ?? problem.type;
    return PROBLEM_STATUS_BY_TYPE[name];
}

/** A job's problem as the error class of its status, or the base error when the status names no class. */
export function errorForProblem(problem: api.Problem): GetCleanError {
    const status = problemStatus(problem);
    const errorClass = status == null ? undefined : errorClasses().get(status);
    if (errorClass == null) {
        return new GetCleanError({ message: problem.title, statusCode: status, body: problem });
    }
    return new errorClass(problem);
}

/** The memory of the ids seen across the pages of one list: whether a page brings anything new, and the filter. */
export class Repeats<T extends { id: string }> {
    private readonly seen = new Set<string>();

    /** Whether any of these items was not seen before; marks nothing. */
    public anyNew(items: T[]): boolean {
        return items.some((item) => !this.seen.has(item.id));
    }

    /** The items not seen before, each now marked as seen. */
    public filter(items: T[]): T[] {
        return items.filter((item) => {
            if (this.seen.has(item.id)) {
                return false;
            }
            this.seen.add(item.id);
            return true;
        });
    }
}

/**
 * The pager with every item whose id was already seen dropped, page after page: a new pager over the same answers,
 * reading each page's items through one memory of the ids, and loading pages until one brings something new or is the
 * last, so a page of repeats is passed over whether the caller iterates the items or asks page by page. Each page's
 * `response` is the answer as the wire gave it.
 */
export function withoutRepeats<T extends { id: string }, R>(
    first: core.Page<T, R>,
    items: (response: R) => T[],
    nextPageToken: (response: R) => string | undefined,
    load: (pageToken: string) => Promise<core.Page<T, R>>,
): core.Page<T, R> {
    const repeats = new Repeats<T>();
    const loadPage = async (response: R): Promise<core.WithRawResponse<R>> => {
        let token = nextPageToken(response);
        for (;;) {
            const page = await load(token ?? "");
            const following = nextPageToken(page.response);
            if (following == null || repeats.anyNew(items(page.response))) {
                return { data: page.response, rawResponse: page.rawResponse };
            }
            token = following;
        }
    };
    return new core.Page<T, R>({
        response: first.response,
        rawResponse: first.rawResponse,
        hasNextPage: (response) => nextPageToken(response) != null,
        getItems: (response) => repeats.filter(items(response)),
        loadPage: (response) => core.HttpResponsePromise.fromPromise(loadPage(response)),
    });
}
