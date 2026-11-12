/**
 * What the tests of the getclean client share: a scripted server that answers each request in turn and keeps every
 * request it was sent; the calls that may bill; and the answers, which are the contract's examples (examples.ts).
 * Where a case needs an answer the contract has no example of, the nearest example is taken and only the members the
 * case needs are changed, each change with its reason beside it.
 */

import { GetClean } from "../../src/index.js";
import {
    CANCEL_JOB_CANCELED,
    FETCH_CONTENTS_BATCH_MIXED,
    FETCH_CONTENTS_BATCH_MIXED_REQUEST,
    FETCH_CONTENTS_DELIVERED,
    FETCH_CONTENTS_DELIVERED_REQUEST,
    FETCH_CONTENTS_INVALID_FIELD,
    FILL_SCHEMA_FILLED,
    FILL_SCHEMA_FILLED_REQUEST,
    GET_JOB_COMPLETED,
    GET_LIMITS_LIMITS,
    HIGHLIGHT_CONTENTS_FOUND,
    HIGHLIGHT_CONTENTS_FOUND_REQUEST,
    SEARCH_BATCH_MIXED,
    SEARCH_BATCH_MIXED_REQUEST,
    SEARCH_DELIVERED,
    SEARCH_DELIVERED_REQUEST,
    SUMMARIZE_CONTENTS_SUMMARY,
    SUMMARIZE_CONTENTS_SUMMARY_REQUEST,
    UPLOAD_CONTENTS_DELIVERED,
    UPLOAD_CONTENTS_INVALID_FIELD,
    UPLOAD_CONTENTS_JOB,
} from "./examples.js";

/** A host no request can reach: `.test` is reserved for testing (RFC 6761), and every answer comes from the script. */
export const BASE_URL = "http://getclean.test";

/** A version 4 UUID in the RFC 9562 layout, the form of the key the client makes for a call given none. */
export const UUID_V4: RegExp = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** A key a caller chose for its own upload, in the key's form: printable characters, at most 255 of them. */
export const CALLERS_KEY = "upload-minutes-2026-11-04";

/** One answer of the scripted server. The request it answers must have the method and path named here. */
export type Step = { method: "GET" | "POST" | "DELETE"; path: string } & (
    | {
          status: number;
          /** The JSON body; none for an answer without one. */
          body?: unknown;
          /** A body sent as written, for an answer that is not JSON. */
          rawBody?: string | undefined;
          headers?: Record<string, string> | undefined;
          /** The server waits this long before it answers, as `get_job` does while a job runs, in seconds of the test's clock. */
          waitSeconds?: number | undefined;
      }
    /** The server never answers; the request ends only when its signal aborts it. */
    | { never: true }
    /** No HTTP answer at all, as when the connection fails. */
    | { transportError: Error }
);

/** Every script made by the test that runs, so that the hook after it can read what each was sent. */
const LIVE_SCRIPTS: Script[] = [];

/**
 * After every test, no script may hold a request it did not expect: a request the client sent and then swallowed,
 * a read of the limits among them, would otherwise go unseen.
 */
afterEach(() => {
    const unexpected = LIVE_SCRIPTS.splice(0).flatMap((script) => script.unexpected);
    expect(unexpected, "requests that no step of the test's script answers").toEqual([]);
});

/**
 * A server that answers requests in the order of its steps and keeps every request. A request that does not match
 * the next step, or comes after the last step, is kept as unexpected and answered with a plain refusal, a 400 with no
 * problem in it, so the call ends; the step stays for the next request, and the hook after the test fails it.
 */
export class Script {
    /** Every URL the client asked to fetch, as it asked, a URL no request can be made of included. */
    public readonly urls: string[] = [];
    /** Every request the client sent, in order, its body still unread. */
    public readonly requests: Request[] = [];
    /** For each request, when it was sent, in milliseconds of the test's clock. */
    public readonly sentAt: number[] = [];
    /** Each request no step answers, as its method, its path and the step that waited, in order. */
    public readonly unexpected: string[] = [];
    /** For each request, when its signal aborted it, in milliseconds of the test's clock; undefined while it is not. */
    private readonly abortedAt: Array<number | undefined> = [];
    private readonly steps: Step[];
    private readonly waiting: Array<{ count: number; resolve: () => void }> = [];

    constructor(steps: Step[]) {
        this.steps = [...steps];
        LIVE_SCRIPTS.push(this);
    }

    public readonly fetch: typeof fetch = async (input, init) => {
        if (init?.signal?.aborted) {
            // A fetch whose signal has already aborted sends nothing and rejects, as the platform's fetch does.
            throw init.signal.reason;
        }
        this.urls.push(input instanceof Request ? input.url : String(input));
        const request = new Request(input, init);
        const index = this.requests.push(request) - 1;
        this.sentAt.push(Date.now());
        this.abortedAt.push(undefined);
        init?.signal?.addEventListener("abort", () => {
            this.abortedAt[index] = Date.now();
        });
        for (const waiter of this.waiting.filter((w) => this.requests.length >= w.count)) {
            this.waiting.splice(this.waiting.indexOf(waiter), 1);
            waiter.resolve();
        }
        const step = this.steps[0];
        const url = new URL(request.url);
        if (step == null || request.method !== step.method || url.pathname !== step.path) {
            const waited = step == null ? "no step left" : `the step ${step.method} ${step.path}`;
            this.unexpected.push(`${request.method} ${url.pathname}, while ${waited} waited`);
            return new Response("no step of the script answers this request", {
                status: 400,
                headers: { "Content-Type": "text/plain" },
            });
        }
        this.steps.shift();
        if ("transportError" in step) {
            throw step.transportError;
        }
        if ("never" in step) {
            return untilAborted(init?.signal);
        }
        if (step.waitSeconds != null) {
            await hold(step.waitSeconds * 1000, init?.signal);
        }
        const body = step.rawBody ?? (step.body === undefined ? null : JSON.stringify(step.body));
        return new Response(body, {
            status: step.status,
            headers: {
                "Content-Type": step.status >= 400 ? "application/problem+json" : "application/json",
                ...step.headers,
            },
        });
    };

    /** A client of the scripted server, with the options a test adds. */
    public client(options: GetClean.Options = {}): GetClean {
        return new GetClean({ apiKey: "a-test-key", baseUrl: BASE_URL, fetch: this.fetch, ...options });
    }

    /** Resolves once the client has sent this many requests. */
    public sent(count: number): Promise<void> {
        if (this.requests.length >= count) {
            return Promise.resolve();
        }
        return new Promise((resolve) => {
            this.waiting.push({ count, resolve });
        });
    }

    /** Each request as its method and path, in order. */
    public calls(): string[] {
        return this.requests.map((request) => `${request.method} ${new URL(request.url).pathname}`);
    }

    /** The query of the request at this index, as the pairs it carries in order. */
    public query(index: number): Array<[string, string]> {
        const request = this.requests[index];
        if (request == null) {
            throw new Error(`no request at index ${index}; ${this.requests.length} were sent`);
        }
        return [...new URL(request.url).searchParams.entries()];
    }

    /** The value of a header on every request whose path is this one, in order. */
    public headers(path: string, name: string): Array<string | null> {
        return this.requests
            .filter((request) => new URL(request.url).pathname === path)
            .map((request) => request.headers.get(name));
    }

    /** How long the request at this index lived before its signal aborted it, in milliseconds. */
    public lifetime(index: number): number | undefined {
        const aborted = this.abortedAt[index];
        const sent = this.sentAt[index];
        return aborted == null || sent == null ? undefined : aborted - sent;
    }
}

function hold(milliseconds: number, signal: AbortSignal | null | undefined): Promise<void> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, milliseconds);
        signal?.addEventListener(
            "abort",
            () => {
                clearTimeout(timer);
                reject(signal.reason);
            },
            { once: true },
        );
    });
}

function untilAborted(signal: AbortSignal | null | undefined): Promise<never> {
    return new Promise((_resolve, reject) => {
        if (signal == null) {
            return;
        }
        if (signal.aborted) {
            reject(signal.reason);
            return;
        }
        signal.addEventListener("abort", () => reject(signal.reason), { once: true });
    });
}

/** How a call ended: its answer as `value`, or what it threw as `error`. */
export type Ending<T> = { value: T } | { error: unknown };

/**
 * The ending of a call, as a promise that never rejects. A test takes a call's ending before it moves the clock, so a
 * call that fails early is never an unhandled rejection, and reads the ending once the clock has moved.
 */
export function settle<T>(promise: Promise<T>): Promise<Ending<T>> {
    return promise.then(
        (value) => ({ value }),
        (error: unknown) => ({ error }),
    );
}

/** A problem type of the contract: its status, title, who must act, whether a retry can help, and its words. */
type ProblemType = {
    status: number;
    title: string;
    who_must_act: string;
    retryable: boolean;
    /** The detail, one sentence in the words the contract's description of the type uses. */
    detail: string;
    /** The members the contract says the type carries, beyond those every problem carries. */
    members?: Record<string, unknown>;
};

/**
 * The problem types these tests use. The status, the title, who must act and whether a retry can help are the
 * contract's table under `Problem.type` and `Problem.retryable`; the detail and the members each type carries are
 * read from the contract's descriptions of the problem responses and of `Problem`'s members.
 */
export const PROBLEM_TYPES: Readonly<Record<string, ProblemType>> = {
    "page-token-invalid": {
        status: 400,
        title: "The page token is invalid",
        who_must_act: "caller",
        retryable: false,
        detail: "The token is unknown, expired, belongs to another record, or the filter changed between pages.",
        members: { change: { field: "page_token" } },
    },
    unauthorized: {
        status: 401,
        title: "The key is missing or rejected",
        who_must_act: "caller",
        retryable: false,
        detail: "The credential is unknown, expired or revoked: refresh the token, sign in again, or use another key.",
    },
    "insufficient-scope": {
        status: 403,
        // An API key's missing scope is the account owner's to add.
        title: "The key lacks a scope this call needs",
        who_must_act: "account_owner",
        retryable: false,
        detail: "The key lacks the scope limits:read, which this call needs.",
        members: { scopes_required: ["limits:read"] },
    },
    "credit-exhausted": {
        status: 403,
        title: "The credit is exhausted",
        who_must_act: "account_owner",
        retryable: false,
        detail: "The credit is exhausted.",
        // The figures of the contract's own illustration under `Problem.amount_needed`: a balance of 0.0020 against a
        // call of 0.0050 lacks 0.0030; the funding page on the host the contract names for it.
        members: {
            balance: { amount: "0.0020", currency: "USD" },
            amount_needed: { amount: "0.0030", currency: "USD" },
            funding_url: "https://app.getclean.ai",
        },
    },
    "not-found": {
        status: 404,
        title: "Not found",
        who_must_act: "caller",
        retryable: false,
        detail: "The job this id names does not exist for this account.",
        members: { change: { field: "job_id" } },
    },
    "idempotency-key-in-flight": {
        status: 409,
        title: "The same request is still running",
        who_must_act: "caller",
        retryable: true,
        detail: "The first call with this key has not answered yet.",
    },
    "record-without-content": {
        status: 409,
        title: "The record has no content",
        who_must_act: "caller",
        retryable: false,
        detail: "The record you named failed, was refused or needs a person, so there is no text to read.",
        members: { change: { operation: "fetch_contents" } },
    },
    "job-expired": {
        status: 410,
        title: "The job has expired",
        who_must_act: "caller",
        retryable: false,
        detail: "The job has expired; upload the document again.",
        // The moment the contract's completed job expires.
        members: { expired_at: GET_JOB_COMPLETED.expires_at, change: { operation: "upload_contents" } },
    },
    "body-too-large": {
        status: 413,
        title: "The body is too large",
        who_must_act: "caller",
        retryable: false,
        detail: "The document part is larger than 100 MiB.",
    },
    "unsupported-media-type": {
        status: 415,
        title: "The media type is not supported",
        who_must_act: "caller",
        // A caller's media type stays wrong however often it is sent.
        retryable: false,
        detail: "The request's media type is not one this operation takes.",
    },
    "invalid-field": {
        status: 422,
        title: "A field is invalid",
        who_must_act: "caller",
        retryable: false,
        // The detail and the violations of the contract's upload example of the type.
        detail: UPLOAD_CONTENTS_INVALID_FIELD.detail,
        members: { violations: UPLOAD_CONTENTS_INVALID_FIELD.violations },
    },
    "destination-refused": {
        status: 422,
        title: "The destination is refused",
        who_must_act: "caller",
        retryable: false,
        detail: "The URL's text names an address that is not globally reachable.",
    },
    "cost-exceeds-cap": {
        status: 422,
        title: "The cost cap is below the smallest call",
        who_must_act: "caller",
        retryable: false,
        detail: "max_cost is below the smallest call's price.",
        // The smallest call, one `contents` unit, at the price of the contract's limits example.
        members: { minimum_cap: GET_LIMITS_LIMITS.prices.contents },
    },
    "rate-limit-exceeded": {
        status: 429,
        title: "The rate limit is exceeded",
        who_must_act: "caller",
        retryable: true,
        detail: "More requests in the minute than the requests policy allows.",
    },
    "legal-block": {
        status: 451,
        title: "Withheld under a legal demand",
        who_must_act: "caller",
        retryable: false,
        detail: "The document is withheld under a legal demand made on getclean.",
        // No example of the contract carries a legal block: its three members, written as the schema describes them.
        members: {
            demand: "An order to withhold the document",
            demanded_by: "A court",
            applies_to: "This document",
        },
    },
    "internal-error": {
        status: 500,
        title: "The service failed",
        who_must_act: "service",
        retryable: false,
        detail: "The service failed; quote the Request-Id when you report it.",
    },
    "gateway-error": {
        status: 502,
        title: "A step behind the service failed",
        who_must_act: "service",
        retryable: true,
        detail: "The model step that is the whole call gave a bad answer.",
    },
    overloaded: {
        status: 503,
        title: "The service is overloaded",
        who_must_act: "service",
        retryable: true,
        detail: "The request could not start within the published queue bound.",
    },
    "gateway-timeout": {
        status: 504,
        title: "A step behind the service timed out",
        who_must_act: "service",
        retryable: true,
        detail: "The model step that is the whole call passed its time bound.",
    },
};

/** The status the contract's table gives a problem type. */
export function statusOf(name: string): number {
    const type = PROBLEM_TYPES[name];
    if (type == null) {
        throw new Error(`no problem type ${name} among these tests' types`);
    }
    return type.status;
}

/**
 * A problem as the server answers it, at the top level of an answer, `status` among its members, under the request
 * id of the contract's problem example `fetch_contents.invalid-field`, standing for the call the problem answers.
 */
export function problem(name: string, members: Record<string, unknown> = {}): Record<string, unknown> {
    const type = PROBLEM_TYPES[name];
    if (type == null) {
        throw new Error(`no problem type ${name} among these tests' types`);
    }
    return {
        type: `https://api.getclean.ai/problems/${name}`,
        title: type.title,
        status: type.status,
        detail: type.detail,
        instance: FETCH_CONTENTS_INVALID_FIELD.instance,
        request_id: FETCH_CONTENTS_INVALID_FIELD.request_id,
        who_must_act: type.who_must_act,
        retryable: type.retryable,
        ...type.members,
        ...members,
    };
}

/**
 * The answer of a problem that asks the caller to wait, as the server sends it: the type's status, the problem with
 * `retry_after_seconds`, and the same seconds in Retry-After, which every 429 and 503 carries.
 */
export function asksToWait(
    name: string,
    seconds: number,
): { status: number; body: Record<string, unknown>; headers: Record<string, string> } {
    return {
        status: statusOf(name),
        body: problem(name, { retry_after_seconds: seconds }),
        headers: { "Retry-After": String(seconds) },
    };
}

/**
 * A problem as a job carries it: no `status`, since it could not equal the status of the answer it stands in, and the
 * upload's `request_id` and `instance` (the contract's `Job.problem`).
 */
export function jobProblem(name: string): Record<string, unknown> {
    const { status: _status, ...topLevel } = problem(name, {
        instance: `https://api.getclean.ai/requests/${UPLOAD_CONTENTS_JOB.request_id}`,
        request_id: UPLOAD_CONTENTS_JOB.request_id,
    });
    return topLevel;
}

/** A bound of the published limits, by its family and its name. */
export type BoundName = { family: "contents" | "search"; name: string };

/**
 * The contract's limits example (`get_limits.limits`) whole, with the bounds a case needs changed, or left out where
 * the change is undefined; the test says why beside each change.
 */
export function limitsWith(
    ...changes: Array<[BoundName, Record<string, number> | undefined]>
): Record<string, unknown> {
    const bounds: Record<string, Record<string, unknown>> = {
        contents: { ...GET_LIMITS_LIMITS.bounds.contents },
        search: { ...GET_LIMITS_LIMITS.bounds.search },
    };
    for (const [{ family, name }, bound] of changes) {
        const members = bounds[family] ?? {};
        if (bound === undefined) {
            delete members[name];
        } else {
            members[name] = bound;
        }
    }
    return { ...GET_LIMITS_LIMITS, bounds };
}

/** The upload's job of the contract's `202` example (`upload_contents.job`): a 312-page document, its parse running. */
export const RUNNING_JOB: typeof UPLOAD_CONTENTS_JOB.job = UPLOAD_CONTENTS_JOB.job;

/** No page done yet of the upload's 312-page document: the counts of a job that ends before its first page. */
const NO_PAGE_DONE = { parsed_count: 0, failed_count: 0, remaining_count: 312 } as const;

/** The cost of a job that bills nothing, zero so far, under the ceiling of the contract's upload example. */
const NOTHING_BILLED = {
    ceiling: RUNNING_JOB.cost.ceiling,
    actual: { amount: "0.0000", currency: "USD" },
    units: {},
    replayed: false,
} as const;

/**
 * The upload's job, final before its first page, with the members that say how it ended. From the running job, what a
 * final job changes: no `stage` and no `retry_after_seconds`, both absent once final, and `expires_at`, present once
 * final, the moment the contract's completed job carries; no page done and nothing billed, since a parse that failed
 * bills nothing.
 */
function failedBeforeItsFirstPage(ending: Record<string, unknown>): Record<string, unknown> {
    const { stage: _stage, retry_after_seconds: _wait, ...job } = RUNNING_JOB;
    return {
        ...job,
        state: "failed",
        finished: true,
        counts: NO_PAGE_DONE,
        cost: NOTHING_BILLED,
        ...ending,
        updated_at: GET_JOB_COMPLETED.updated_at,
        expires_at: GET_JOB_COMPLETED.expires_at,
    };
}

/** The upload's job, failed before a record was made, with the problem that ended it. */
export function failedJob(problemBody: Record<string, unknown>): Record<string, unknown> {
    return failedBeforeItsFirstPage({ problem: problemBody });
}

/**
 * The upload's job, failed with a record that says why: a failed job names its record when one was made, and carries
 * the record's outcome.
 */
export function failedJobWithRecord(record: { id: string; outcome: object }): Record<string, unknown> {
    return failedBeforeItsFirstPage({ outcome: record.outcome, contents_id: record.id });
}

/**
 * The upload's job, canceled before a page was done. The contract's canceled job (`cancel_job.canceled`) under the
 * upload's job id, with no record, so no `contents_id` and no `outcome`, no page done and nothing billed: a cancel
 * before any page is done makes no record and bills nothing.
 */
export function canceledJobWithoutRecord(): Record<string, unknown> {
    const { contents_id: _record, outcome: _outcome, ...job } = CANCEL_JOB_CANCELED;
    return { ...job, id: RUNNING_JOB.id, counts: NO_PAGE_DONE, cost: NOTHING_BILLED };
}

/** A final job of the upload, with the members that tie a record to it. */
export type FinalJob = {
    contents_id: string;
    outcome: { kind: string; reason: string };
    counts: { parsed_count: number; failed_count: number; remaining_count: number };
} & Record<string, unknown>;

/** A record as the scripted server answers it: its id, and the record's other members. */
export type RecordBody = { id: string } & Record<string, unknown>;

/**
 * The contract's completed job (`get_job.completed`) with every page parsed, for a record delivered whole: the counts
 * and the outcome of all 312 pages, and their bill at the contract's prices (`get_limits.limits`): one record, 312
 * pages and the three pages read from an image, 0.0050 + 0.3120 + 0.0150 USD.
 */
export const JOB_COMPLETED_WHOLE: FinalJob = {
    ...GET_JOB_COMPLETED,
    counts: { parsed_count: 312, failed_count: 0, remaining_count: 0 },
    cost: {
        ...GET_JOB_COMPLETED.cost,
        actual: { amount: "0.3320", currency: "USD" },
        units: { ...GET_JOB_COMPLETED.cost.units, document_pages: 312 },
    },
    outcome: { kind: "delivered", reason: "whole" },
};

/**
 * A record as a read answers it (`get_contents`): without `cost`, which only the call that billed the record carries
 * (the contract, `Contents.cost`).
 */
export function asRead<T extends { cost?: unknown }>(record: T): Omit<T, "cost"> {
    const { cost: _billed, ...read } = record;
    return read;
}

/**
 * The record a final job names, as a read of it answers. The contract shows no read of an uploaded record, so this is
 * its uploaded record (`upload_contents.delivered`), read, with what ties it to the job changed: the id the job names,
 * the job's outcome, which is the record's own, and `pages` as the job counts them, the failed pages by number. Its
 * text, sizes and times stay the example's, and so do the pages read from an image, none, since the contract shows no
 * recognized page.
 */
export function recordOf(job: FinalJob, failedPages: number[] = []): RecordBody {
    const { parsed_count, failed_count, remaining_count } = job.counts;
    if (failedPages.length !== failed_count) {
        throw new Error(`the job failed ${failed_count} pages, and ${failedPages.length} were named`);
    }
    const record = asRead(UPLOAD_CONTENTS_DELIVERED.contents);
    return {
        ...record,
        id: job.contents_id,
        outcome: job.outcome,
        pages: {
            ...record.pages,
            count: parsed_count + failed_count + remaining_count,
            parsed_count,
            failed_pages: failedPages,
        },
    };
}

/** The record of the whole job, as the read after it answers. */
export const RECORD_OF_THE_WHOLE_JOB: RecordBody = recordOf(JOB_COMPLETED_WHOLE);

/**
 * The record of the contract's completed job, as the read after it answers: 310 of its 312 pages parsed, pages 57 and
 * 203 failed, two pages picked since the contract does not say which.
 */
export const RECORD_OF_THE_COMPLETED_JOB: RecordBody = recordOf(GET_JOB_COMPLETED, [57, 203]);

/** A call that may bill: the contract's operations whose parameters carry an `Idempotency-Key`. */
export type BilledCall = {
    /** The client's method. */
    method: string;
    /** The path the method posts to. */
    path: string;
    /** The family whose bounds time the call. */
    family: "contents" | "search";
    /** The bound that times the call: the two batches run under `batch_seconds`, every other call under `call_seconds`. */
    bound: "call_seconds" | "batch_seconds";
    /** The status of the call's success. */
    status: number;
    /** The answer of the call's success: the contract's example of it. */
    answer: unknown;
    /** Sends the call with the request of the contract's example, the caller's key when one is given. */
    send: (client: GetClean, key?: string, requestOptions?: GetClean.RequestOptions) => Promise<unknown>;
};

/**
 * The bytes the upload tests send for the contract's sample document, `minutes.pdf`: the start of a PDF, enough for
 * a test that compares bytes, since the scripted server parses nothing.
 */
export const MINUTES_PDF = "%PDF-1.7\n% minutes of the meeting\n";

/** The record the contract's examples of the model operations work on, as their answers name it. */
export const RECORD_ID: string = HIGHLIGHT_CONTENTS_FOUND.contents_id;

/** A request built from the contract's request example, with the members a call adds, as the method takes it. */
function requestOf<T>(example: object, members: Record<string, unknown>): T {
    return { ...structuredClone(example), ...members } as T;
}

/** The calls that may bill, one by one; the tests that need one call name it. */
export const FETCH_CONTENTS: BilledCall = {
    method: "fetchContents",
    path: "/v1/contents",
    family: "contents",
    bound: "call_seconds",
    status: 201,
    answer: FETCH_CONTENTS_DELIVERED,
    send: (client, key, options) =>
        client.fetchContents(requestOf(FETCH_CONTENTS_DELIVERED_REQUEST, { "Idempotency-Key": key }), options),
};

const FETCH_CONTENTS_BATCH: BilledCall = {
    method: "fetchContentsBatch",
    path: "/v1/contents:batch",
    family: "contents",
    bound: "batch_seconds",
    status: 200,
    answer: FETCH_CONTENTS_BATCH_MIXED,
    send: (client, key, options) =>
        client.fetchContentsBatch(requestOf(FETCH_CONTENTS_BATCH_MIXED_REQUEST, { "Idempotency-Key": key }), options),
};

export const HIGHLIGHT_CONTENTS: BilledCall = {
    method: "highlightContents",
    path: `/v1/contents/${RECORD_ID}:highlight`,
    family: "contents",
    bound: "call_seconds",
    status: 200,
    answer: HIGHLIGHT_CONTENTS_FOUND,
    send: (client, key, options) =>
        client.highlightContents(
            RECORD_ID,
            requestOf(HIGHLIGHT_CONTENTS_FOUND_REQUEST, { "Idempotency-Key": key }),
            options,
        ),
};

export const FILL_SCHEMA: BilledCall = {
    method: "fillSchema",
    path: `/v1/contents/${RECORD_ID}:fill`,
    family: "contents",
    bound: "call_seconds",
    status: 200,
    answer: FILL_SCHEMA_FILLED,
    send: (client, key, options) =>
        client.fillSchema(RECORD_ID, requestOf(FILL_SCHEMA_FILLED_REQUEST, { "Idempotency-Key": key }), options),
};

export const SUMMARIZE_CONTENTS: BilledCall = {
    method: "summarizeContents",
    path: `/v1/contents/${RECORD_ID}:summarize`,
    family: "contents",
    bound: "call_seconds",
    status: 200,
    answer: SUMMARIZE_CONTENTS_SUMMARY,
    send: (client, key, options) =>
        client.summarizeContents(
            RECORD_ID,
            requestOf(SUMMARIZE_CONTENTS_SUMMARY_REQUEST, { "Idempotency-Key": key }),
            options,
        ),
};

/** The upload of the contract's sample document, whose request example names the file for its bytes. */
export const UPLOAD_CONTENTS: BilledCall = {
    method: "uploadContents",
    path: "/v1/contents:upload",
    family: "contents",
    bound: "call_seconds",
    status: 201,
    answer: UPLOAD_CONTENTS_DELIVERED,
    send: (client, key, options) =>
        client.uploadContents({ "Idempotency-Key": key, document: Buffer.from(MINUTES_PDF) }, options),
};

const SEARCH: BilledCall = {
    method: "search",
    path: "/v1/search",
    family: "search",
    bound: "call_seconds",
    status: 201,
    answer: SEARCH_DELIVERED,
    send: (client, key, options) =>
        client.search(requestOf(SEARCH_DELIVERED_REQUEST, { "Idempotency-Key": key }), options),
};

const SEARCH_BATCH: BilledCall = {
    method: "searchBatch",
    path: "/v1/search:batch",
    family: "search",
    bound: "batch_seconds",
    status: 200,
    answer: SEARCH_BATCH_MIXED,
    send: (client, key, options) =>
        client.searchBatch(requestOf(SEARCH_BATCH_MIXED_REQUEST, { "Idempotency-Key": key }), options),
};

/** The eight calls that may bill, each with its request and its answer from the contract's examples. */
export const BILLED_CALLS: BilledCall[] = [
    FETCH_CONTENTS,
    FETCH_CONTENTS_BATCH,
    HIGHLIGHT_CONTENTS,
    FILL_SCHEMA,
    SUMMARIZE_CONTENTS,
    UPLOAD_CONTENTS,
    SEARCH,
    SEARCH_BATCH,
];

/**
 * An opaque page token in the form of the contract's one example token, `eyJzIjoic3JjaF80SG0iLCJvIjozfQ`, the
 * base64url of where the next page starts: the list's name and the offset.
 */
export function pageToken(list: string, offset: number): string {
    return Buffer.from(JSON.stringify({ s: list, o: offset })).toString("base64url");
}
