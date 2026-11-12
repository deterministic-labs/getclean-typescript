/**
 * The upload's `wait` helper. Off, the upload's answer comes as the wire gives it. On, a `202` is followed: the job is
 * polled with `wait_seconds` 60 until it is final or its bound and one more minute have passed, then the record is
 * read under the upload's own `max_characters`, `formats` and `block_kinds`. A job that failed with no record raises
 * the error class of its problem's status; a job canceled with no record raises `JobCanceled`; a job still running at
 * the bound comes back as it stands. The polls and the read carry the caller's headers and abort signal alone. A poll
 * or the read that fails for a transient reason is tried again within the bound, after the wait the failure names, else
 * after a backoff that doubles from 1 second; a `4xx` or an abort ends the helper. Every error the wait raises carries
 * the last job seen and the upload's key.
 */

import {
    ContentTooLargeError,
    ForbiddenError,
    GoneError,
    InternalServerError,
    ServiceUnavailableError,
    UnavailableForLegalReasonsError,
    UnprocessableEntityError,
} from "../../src/api/errors/index.js";
import { type GetClean, GetCleanError, JobCanceled } from "../../src/index.js";
import {
    CANCEL_JOB_CANCELED,
    FETCH_CONTENTS_FAILED,
    GET_CONTENTS_CONTENTS_EXPIRED,
    GET_JOB_COMPLETED,
    GET_LIMITS_LIMITS,
    UPLOAD_CONTENTS_DELIVERED,
    UPLOAD_CONTENTS_JOB,
} from "./examples.js";
import {
    asksToWait,
    asRead,
    canceledJobWithoutRecord,
    type Ending,
    failedJob,
    failedJobWithRecord,
    JOB_COMPLETED_WHOLE,
    jobProblem,
    limitsWith,
    MINUTES_PDF,
    problem,
    RECORD_OF_THE_COMPLETED_JOB,
    RECORD_OF_THE_WHOLE_JOB,
    RUNNING_JOB,
    recordOf,
    Script,
    type Step,
    settle,
    statusOf,
    UPLOAD_CONTENTS,
    UUID_V4,
} from "./support.js";

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

const JOB_PATH = `/v1/jobs/${RUNNING_JOB.id}`;
const LIMITS: Step = { method: "GET", path: "/v1/limits", status: 200, body: GET_LIMITS_LIMITS };
const ACCEPTED: Step = { method: "POST", path: UPLOAD_CONTENTS.path, status: 202, body: UPLOAD_CONTENTS_JOB };

/** A poll of the upload's job, answered with the job as it stands. */
function poll(job: unknown, waitSeconds?: number): Step {
    return { method: "GET", path: JOB_PATH, status: 200, body: job, waitSeconds };
}

/** The read of a record, answered with the record. */
function read(record: { id: string }): Step {
    return { method: "GET", path: `/v1/contents/${record.id}`, status: 200, body: record };
}

/** An upload of the contract's sample document that waits for its job. */
function sendWaiting(
    script: Script,
    fields: Partial<GetClean.UploadContentsRequest> = {},
    requestOptions: GetClean.RequestOptions = {},
): Promise<Ending<GetClean.ContentsUpload>> {
    return settle(
        script.client().uploadContents({ document: Buffer.from(MINUTES_PDF), wait: true, ...fields }, requestOptions),
    );
}

describe("an answer the helper does not follow", () => {
    it.each([
        ["unset", undefined],
        ["false", false],
        ["true", true],
    ])("returns a 201 as the wire gives it, with no poll, when wait is %s", async (_case, wait) => {
        // An upload that finished within its wait answers 201 with the record; the helper has nothing to follow.
        const script = new Script([
            LIMITS,
            { method: "POST", path: UPLOAD_CONTENTS.path, status: 201, body: UPLOAD_CONTENTS_DELIVERED },
        ]);

        const ended = await settle(script.client().uploadContents({ document: Buffer.from(MINUTES_PDF), wait }));

        expect(script.calls()).toEqual(["GET /v1/limits", `POST ${UPLOAD_CONTENTS.path}`]);
        expect(ended).toEqual({ value: UPLOAD_CONTENTS_DELIVERED });
    });

    it.each([
        ["unset", undefined],
        ["false", false],
    ])("returns a 202 as the wire gives it, with no poll, when wait is %s", async (_case, wait) => {
        // The helper is off by default: a 202 comes back with its job, for the caller to follow.
        const script = new Script([LIMITS, ACCEPTED]);

        const ended = await settle(script.client().uploadContents({ document: Buffer.from(MINUTES_PDF), wait }));

        expect(script.calls()).toEqual(["GET /v1/limits", `POST ${UPLOAD_CONTENTS.path}`]);
        expect(ended).toEqual({ value: UPLOAD_CONTENTS_JOB });
    });
});

describe("following a job to its record", () => {
    it("polls with wait_seconds 60 until the job completes, then reads the record under the upload's own fields", async () => {
        // The polls ask the server to wait up to 60 seconds before each answer; the read takes the upload's max_characters,
        // formats and block_kinds and no scope; the answer carries the record, the final job and the upload's
        // request id.
        const script = new Script([
            LIMITS,
            ACCEPTED,
            poll(RUNNING_JOB),
            poll(JOB_COMPLETED_WHOLE),
            read(RECORD_OF_THE_WHOLE_JOB),
        ]);

        const ended = await sendWaiting(script, {
            max_characters: 5000,
            formats: ["markdown", "links"],
            block_kinds: ["text", "table"],
        });

        expect(script.calls()).toEqual([
            "GET /v1/limits",
            `POST ${UPLOAD_CONTENTS.path}`,
            `GET ${JOB_PATH}`,
            `GET ${JOB_PATH}`,
            `GET /v1/contents/${GET_JOB_COMPLETED.contents_id}`,
        ]);
        expect(script.query(2), "the first poll").toEqual([["wait_seconds", "60"]]);
        expect(script.query(3), "the second poll").toEqual([["wait_seconds", "60"]]);
        expect(script.query(4), "the read").toEqual([
            ["max_characters", "5000"],
            ["formats", "markdown"],
            ["formats", "links"],
            ["block_kinds", "text"],
            ["block_kinds", "table"],
        ]);
        expect(ended).toEqual({
            value: {
                contents: RECORD_OF_THE_WHOLE_JOB,
                job: JOB_COMPLETED_WHOLE,
                request_id: UPLOAD_CONTENTS_JOB.request_id,
            },
        });
    });

    it("reads the record with none of the three fields when the upload sent none", async () => {
        // The read takes the upload's own fields, so an upload that sent none reads with none.
        const script = new Script([LIMITS, ACCEPTED, poll(JOB_COMPLETED_WHOLE), read(RECORD_OF_THE_WHOLE_JOB)]);

        const ended = await sendWaiting(script);

        expect(script.calls().at(-1)).toBe(`GET /v1/contents/${GET_JOB_COMPLETED.contents_id}`);
        expect(script.query(3), "the read").toEqual([]);
        expect(ended).toEqual({
            value: {
                contents: RECORD_OF_THE_WHOLE_JOB,
                job: JOB_COMPLETED_WHOLE,
                request_id: UPLOAD_CONTENTS_JOB.request_id,
            },
        });
    });

    it("reads the record without a list the upload sent empty, since a form carries no empty list", async () => {
        // The read takes only the lists the upload sent: a form carries no empty list and a query refuses one.
        const script = new Script([LIMITS, ACCEPTED, poll(JOB_COMPLETED_WHOLE), read(RECORD_OF_THE_WHOLE_JOB)]);

        const ended = await sendWaiting(script, { formats: [], block_kinds: ["table"] });

        const form = await script.requests[1]?.formData();
        expect(form?.getAll("formats"), "the upload's form carries no formats part").toEqual([]);
        expect(script.query(3), "the read").toEqual([["block_kinds", "table"]]);
        expect(ended).toEqual({
            value: {
                contents: RECORD_OF_THE_WHOLE_JOB,
                job: JOB_COMPLETED_WHOLE,
                request_id: UPLOAD_CONTENTS_JOB.request_id,
            },
        });
    });

    it("returns the record of a job completed with pages failed as the wire gives it, partial", async () => {
        // A completed job's record is delivered or partial; a partial one comes back as it was read. The contract's
        // completed job is this case: two of its pages failed.
        const script = new Script([LIMITS, ACCEPTED, poll(GET_JOB_COMPLETED), read(RECORD_OF_THE_COMPLETED_JOB)]);

        const ended = await sendWaiting(script);

        expect(script.calls()).toEqual([
            "GET /v1/limits",
            `POST ${UPLOAD_CONTENTS.path}`,
            `GET ${JOB_PATH}`,
            `GET /v1/contents/${GET_JOB_COMPLETED.contents_id}`,
        ]);
        expect(ended).toEqual({
            value: {
                contents: RECORD_OF_THE_COMPLETED_JOB,
                job: GET_JOB_COMPLETED,
                request_id: UPLOAD_CONTENTS_JOB.request_id,
            },
        });
    });

    it("returns the record of a job that failed with a record, and raises nothing", async () => {
        // A job that failed after making a record names it; the record, failed, is the answer.
        // The upload names an address, so its record is a fetch's: the contract's failed record, a bot challenge
        // where the page should be, read.
        const job = failedJobWithRecord(FETCH_CONTENTS_FAILED);
        const record = asRead(FETCH_CONTENTS_FAILED);
        const script = new Script([LIMITS, ACCEPTED, poll(job), read(record)]);

        const ended = await settle(
            script.client().uploadContents({ url: FETCH_CONTENTS_FAILED.source.url, wait: true }),
        );

        expect(script.calls().at(-1)).toBe(`GET /v1/contents/${FETCH_CONTENTS_FAILED.id}`);
        expect(ended).toEqual({
            value: { contents: record, job, request_id: UPLOAD_CONTENTS_JOB.request_id },
        });
    });

    it("returns the record of a job canceled with pages done, partial and canceled", async () => {
        // A job canceled with pages done keeps them as a record, partial and canceled, which is the answer.
        // The contract's canceled job under the upload's job id, and the record it names: 41 of its 312 pages,
        // partial and canceled.
        const canceled = { ...CANCEL_JOB_CANCELED, id: RUNNING_JOB.id };
        const record = recordOf(CANCEL_JOB_CANCELED);
        const script = new Script([LIMITS, ACCEPTED, poll(canceled), read(record)]);

        const ended = await sendWaiting(script);

        expect(script.calls().at(-1)).toBe(`GET /v1/contents/${CANCEL_JOB_CANCELED.contents_id}`);
        expect(ended).toEqual({
            value: { contents: record, job: canceled, request_id: UPLOAD_CONTENTS_JOB.request_id },
        });
    });
});

/** The problem types a job can fail with, before a record exists, and the generated class of each one's status. */
const JOB_FAILURES: Array<[string, new (...args: never[]) => GetCleanError]> = [
    ["body-too-large", ContentTooLargeError],
    ["invalid-field", UnprocessableEntityError],
    ["destination-refused", UnprocessableEntityError],
    ["cost-exceeds-cap", UnprocessableEntityError],
    ["credit-exhausted", ForbiddenError],
    ["legal-block", UnavailableForLegalReasonsError],
    ["internal-error", InternalServerError],
];

describe("a job that ends with no record", () => {
    it.each(
        JOB_FAILURES,
    )("raises a job failed with %s as the error class of its status, the problem on its body", async (name, errorClass) => {
        // A job's problem carries no status; it is raised as the class of the status the contract's table gives its
        // type, the status on the error and the problem as the job carried it.
        const failed = failedJob(jobProblem(name));
        const script = new Script([LIMITS, ACCEPTED, poll(failed)]);

        const ended = await sendWaiting(script);

        expect(script.calls(), "no read: there is no record").toEqual([
            "GET /v1/limits",
            `POST ${UPLOAD_CONTENTS.path}`,
            `GET ${JOB_PATH}`,
        ]);
        expect(ended).toEqual({ error: expect.any(errorClass) });
        const error = (ended as { error: GetCleanError }).error;
        expect(error.statusCode, "the status the contract's table gives the type").toBe(statusOf(name));
        expect(error.body).toEqual(jobProblem(name));
    });

    it("puts the failed job on the error it raises", async () => {
        // The error of a job that failed with no record carries the job, so the caller holds its id.
        const failed = failedJob(jobProblem("internal-error"));
        const script = new Script([LIMITS, ACCEPTED, poll(failed)]);

        const ended = await sendWaiting(script);

        expect(ended).toEqual({ error: expect.any(InternalServerError) });
        expect((ended as { error: GetCleanError }).error.job).toEqual(failed);
    });

    it("raises a problem whose type the contract's table does not hold as the SDK's base error", async () => {
        // A type the table lacks, as a later version may add, names no status: the base error carries the problem.
        // The contract's internal-error problem under a type and a title the table lacks.
        const unnamed = {
            ...jobProblem("internal-error"),
            type: "https://api.getclean.ai/problems/a-type-this-version-does-not-name",
            title: "A type this version does not name",
        };
        const script = new Script([LIMITS, ACCEPTED, poll(failedJob(unnamed))]);

        const ended = await sendWaiting(script);

        expect(ended).toEqual({ error: expect.any(GetCleanError) });
        const error = (ended as { error: GetCleanError }).error;
        expect(error.constructor, "the base class itself, no class of a status").toBe(GetCleanError);
        expect(error.statusCode).toBeUndefined();
        expect(error.body).toEqual(unnamed);
    });

    it("raises JobCanceled carrying the job when the job was canceled with no record", async () => {
        // A cancel before any page was done leaves no record: JobCanceled carries the job, its message the job's id.
        const canceled = canceledJobWithoutRecord();
        const script = new Script([LIMITS, ACCEPTED, poll(canceled)]);

        const ended = await sendWaiting(script);

        expect(script.calls().at(-1)).toBe(`GET ${JOB_PATH}`);
        expect(ended).toEqual({ error: expect.any(JobCanceled) });
        const error = (ended as { error: JobCanceled }).error;
        expect(error.job).toEqual(canceled);
        expect(error.message).toContain(RUNNING_JOB.id);
    });
});

describe("the bound of the wait", () => {
    /** The number of polls before the helper gives up on a job that keeps running, each waited its whole minute. */
    async function pollsUntilTheBound(limitsStep: Step): Promise<{ polls: number; ended: unknown }> {
        const script = new Script([limitsStep, ACCEPTED, ...Array.from({ length: 40 }, () => poll(RUNNING_JOB, 60))]);
        const ending = sendWaiting(script);
        // Forty minutes, past every bound these tests set.
        await vi.advanceTimersByTimeAsync(40 * 60_000);
        const polls = script.calls().filter((call) => call === `GET ${JOB_PATH}`).length;
        return { polls, ended: await ending };
    }

    it("returns a job still running at the bound as it stands, with no error, and polls no more", async () => {
        // At the bound the job comes back as it stands for the caller to decide; the contract's bound, 1800 seconds,
        // and one more minute make 31 polls of a minute each.
        const { polls, ended } = await pollsUntilTheBound(LIMITS);

        expect(polls, "1800 seconds and one more minute, a minute a poll").toBe(31);
        expect(ended).toEqual({ value: { job: RUNNING_JOB, request_id: UPLOAD_CONTENTS_JOB.request_id } });
    });

    it("gives a job 30 minutes and one more while the limits cannot be read", async () => {
        // Until the limits are read the bound is 30 minutes, and one more minute.
        const { polls } = await pollsUntilTheBound({
            method: "GET",
            path: "/v1/limits",
            status: 403,
            body: problem("insufficient-scope"),
        });

        expect(polls, "31 minutes, a minute a poll").toBe(31);
    });

    it("gives a job its job_seconds bound from the limits and one more minute", async () => {
        // The bound is Limits.bounds.contents.job_seconds plus a minute; 600 seconds, a bound other than the
        // contract's 1800, which equals the bound of unread limits, make 11 polls.
        const { polls } = await pollsUntilTheBound({
            method: "GET",
            path: "/v1/limits",
            status: 200,
            body: limitsWith([{ family: "contents", name: "job_seconds" }, { max: 600 }]),
        });

        expect(polls, "600 seconds and one more minute, a minute a poll").toBe(11);
    });
});

/** A trace context of the W3C example form, sent as a caller sends it, through the request options. */
const TRACEPARENT = "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01";

describe("the options of the polls and the read", () => {
    it("runs each poll under its own wait plus the margin, 70 seconds, whatever timeout the upload had", async () => {
        // A poll asks the server to wait 60 seconds before it answers and runs under that wait plus 10, not under the
        // timeout the caller gave the upload.
        const script = new Script([LIMITS, ACCEPTED, { method: "GET", path: JOB_PATH, never: true }]);

        void sendWaiting(script, {}, { timeoutInSeconds: 3 });
        await vi.advanceTimersByTimeAsync(70_000);

        expect(script.calls()).toEqual(["GET /v1/limits", `POST ${UPLOAD_CONTENTS.path}`, `GET ${JOB_PATH}`]);
        expect(script.lifetime(2), "the poll is cut at 70 seconds").toBe(70_000);
    });

    it("runs the read under the client's timeout, not the timeout the upload had", async () => {
        // The read carries none of the upload's timeout: a read that hangs is cut at the client's 120 seconds.
        const script = new Script([
            LIMITS,
            ACCEPTED,
            poll(JOB_COMPLETED_WHOLE),
            { method: "GET", path: `/v1/contents/${GET_JOB_COMPLETED.contents_id}`, never: true },
        ]);

        void sendWaiting(script, {}, { timeoutInSeconds: 3 });
        await vi.advanceTimersByTimeAsync(120_000);

        expect(script.lifetime(3), "the read is cut at the client's 120 seconds").toBe(120_000);
    });

    it("sends the caller's headers on every poll and on the read", async () => {
        // The polls and the read carry the caller's headers.
        const script = new Script([
            LIMITS,
            ACCEPTED,
            poll(RUNNING_JOB),
            poll(JOB_COMPLETED_WHOLE),
            read(RECORD_OF_THE_WHOLE_JOB),
        ]);

        await sendWaiting(script, {}, { headers: { traceparent: TRACEPARENT } });

        expect(script.headers(JOB_PATH, "traceparent")).toEqual([TRACEPARENT, TRACEPARENT]);
        expect(script.headers(`/v1/contents/${GET_JOB_COMPLETED.contents_id}`, "traceparent")).toEqual([TRACEPARENT]);
    });

    it("sends none of the upload's query on the polls and the read", async () => {
        // The polls and the read carry none of the upload's query, body or timeout options.
        const script = new Script([
            LIMITS,
            ACCEPTED,
            poll(RUNNING_JOB),
            poll(JOB_COMPLETED_WHOLE),
            read(RECORD_OF_THE_WHOLE_JOB),
        ]);

        await sendWaiting(script, {}, { queryParams: { trace: "on" } });

        expect(script.query(1), "the upload keeps its own query").toEqual([["trace", "on"]]);
        expect(script.query(2), "the first poll").toEqual([["wait_seconds", "60"]]);
        expect(script.query(3), "the second poll").toEqual([["wait_seconds", "60"]]);
        expect(script.query(4), "the read").toEqual([]);
    });

    it("ends the helper when the caller aborts during a poll, and sends nothing more", async () => {
        // The polls carry the caller's abort signal: an abort cuts the poll and ends the helper.
        const controller = new AbortController();
        const script = new Script([LIMITS, ACCEPTED, { method: "GET", path: JOB_PATH, never: true }]);

        const ended = sendWaiting(script, {}, { abortSignal: controller.signal });
        // The caller aborts 10 seconds into the first poll, which the server keeps waiting on.
        await vi.advanceTimersByTimeAsync(10_000);
        controller.abort();
        // Past the poll's own 70 seconds, in which another poll would show.
        await vi.advanceTimersByTimeAsync(70_000);

        expect(script.calls(), "nothing after the abort").toEqual([
            "GET /v1/limits",
            `POST ${UPLOAD_CONTENTS.path}`,
            `GET ${JOB_PATH}`,
        ]);
        expect(script.lifetime(2), "the poll is cut at the abort, 10 seconds in").toBe(10_000);
        expect(await ended).toEqual({ error: expect.any(GetCleanError) });
    });
});

/** The path of the read of the record the completed job names. */
const RECORD_PATH = `/v1/contents/${GET_JOB_COMPLETED.contents_id}`;

/** Where a transient failure can stand: the polls of the job, or the read of its record, with the steps around them. */
const TARGETS: Array<{ target: string; path: string; before: Step[]; after: Step[] }> = [
    { target: "a poll", path: JOB_PATH, before: [], after: [poll(JOB_COMPLETED_WHOLE), read(RECORD_OF_THE_WHOLE_JOB)] },
    {
        target: "the read",
        path: RECORD_PATH,
        before: [poll(JOB_COMPLETED_WHOLE)],
        after: [read(RECORD_OF_THE_WHOLE_JOB)],
    },
];

/**
 * Five refusals of a poll or the read, each one attempt, where every answer names a wait: the first four name 2 seconds
 * and the fifth 3, so each of the helper's waits tells which refusal it followed.
 */
function fiveNamingWaits(path: string, name: string): Step[] {
    const asked: Step = { method: "GET", path, ...asksToWait(name, 2) };
    return [asked, asked, asked, asked, { method: "GET", path, ...asksToWait(name, 3) }];
}

/** The helper's waits after five refusals: the 2 seconds the first four name, then the 3 seconds the fifth names. */
const NAMED_WAITS_MS = [2000, 2000, 2000, 2000, 3000];

/**
 * The transient failures of a poll or the read, each refusal one attempt: the steps of one round of failures, and the
 * helper's waits between the tries of two rounds and the answer, in milliseconds. A 429 and a 503 name their wait, which
 * the helper takes; a 500, a transport failure and a timeout name none, and the helper waits its backoff, 1 second and
 * then 2.
 */
const FAILURES: Array<{ failure: string; waits: string; round: (path: string) => Step[]; gapsMs: number[] }> = [
    {
        failure: "five 503s, each naming a wait",
        waits: "the 3 seconds the last 503 names, each time",
        round: (path) => fiveNamingWaits(path, "overloaded"),
        gapsMs: [...NAMED_WAITS_MS, ...NAMED_WAITS_MS],
    },
    {
        failure: "five 429s, each naming a wait",
        waits: "the 3 seconds the last 429 names, each time",
        round: (path) => fiveNamingWaits(path, "rate-limit-exceeded"),
        gapsMs: [...NAMED_WAITS_MS, ...NAMED_WAITS_MS],
    },
    {
        failure: "a 500",
        waits: "a backoff of 1 second, then 2",
        round: (path) => [{ method: "GET", path, status: 500, body: problem("internal-error") }],
        gapsMs: [1000, 2000],
    },
    {
        failure: "a transport failure",
        waits: "a backoff of 1 second, then 2",
        round: (path) => [{ method: "GET", path, transportError: new TypeError("fetch failed") }],
        gapsMs: [1000, 2000],
    },
    {
        failure: "a timeout",
        waits: "a backoff of 1 second, then 2",
        round: (path) => [{ method: "GET", path, never: true }],
        gapsMs: [1000, 2000],
    },
];

describe("a poll or a read that fails", () => {
    it.each(
        TARGETS.flatMap((target) =>
            FAILURES.map((failure) => [
                `${target.target} that meets ${failure.failure}, twice, is tried again after ${failure.waits}`,
                { ...failure, ...target },
            ]),
        ) as Array<[string, (typeof FAILURES)[number] & (typeof TARGETS)[number]]>,
    )("%s", async (_title, { target, path, before, after, round, gapsMs }) => {
        // A poll or the read that fails for a transient reason, each one attempt, is tried again within the bound: after
        // the wait the failure names, else after a backoff that doubles from 1 second, at the middle of the draw here.
        // Two rounds of failures, then the answer.
        vi.spyOn(Math, "random").mockReturnValue(0.5);
        const script = new Script([LIMITS, ACCEPTED, ...before, ...round(path), ...round(path), ...after]);

        const ended = sendWaiting(script);
        await vi.runAllTimersAsync();

        const tries = script.calls().flatMap((call, index) => (call === `GET ${path}` ? [index] : []));
        expect(tries, `the tries of ${target}`).toHaveLength(2 * round(path).length + 1);
        const gaps = tries.slice(1).map((index, n) => {
            const previous = tries[n] ?? Number.NaN;
            const endedAt = (script.sentAt[previous] ?? Number.NaN) + (script.lifetime(previous) ?? 0);
            return (script.sentAt[index] ?? Number.NaN) - endedAt;
        });
        expect(gaps, "the waits between the tries, in milliseconds").toEqual(gapsMs);
        expect(await ended).toEqual({
            value: {
                contents: RECORD_OF_THE_WHOLE_JOB,
                job: JOB_COMPLETED_WHOLE,
                request_id: UPLOAD_CONTENTS_JOB.request_id,
            },
        });
    });

    it("ends at the bound when a poll's failure lasts: no try begins whose wait would end past it, and the last failure comes back with the job as last seen", async () => {
        // A failure that lasts is tried again only while the wait before the next try ends within the bound, here 600
        // seconds and one more minute; then the last failure comes back with the job as it was last seen. A 500 names
        // no wait, so each try is one request, and the helper waits its backoff: 1 second, doubling to the ceiling of
        // 30, at the middle of the draw.
        vi.spyOn(Math, "random").mockReturnValue(0.5);
        const boundMs = (600 + 60) * 1000;
        const triesAllowed = [0];
        for (let waitMs = 1000; (triesAllowed.at(-1) ?? 0) + waitMs <= boundMs; waitMs = Math.min(2 * waitMs, 30_000)) {
            triesAllowed.push((triesAllowed.at(-1) ?? 0) + waitMs);
        }
        const failed: Step = { method: "GET", path: JOB_PATH, status: 500, body: problem("internal-error") };
        const script = new Script([
            {
                method: "GET",
                path: "/v1/limits",
                status: 200,
                body: limitsWith([{ family: "contents", name: "job_seconds" }, { max: 600 }]),
            },
            ACCEPTED,
            ...triesAllowed.map(() => failed),
        ]);

        const ended = sendWaiting(script);
        await vi.runAllTimersAsync();

        const polls = script.calls().flatMap((call, index) => (call === `GET ${JOB_PATH}` ? [index] : []));
        const first = script.sentAt[polls[0] ?? Number.NaN] ?? Number.NaN;
        const tries = polls.map((index) => (script.sentAt[index] ?? Number.NaN) - first);
        expect(tries, "every try begun within the bound, and none whose wait would end past it").toEqual(triesAllowed);
        expect((tries.at(-1) ?? 0) + 30_000, "the wait before one more try would end past the bound").toBeGreaterThan(
            boundMs,
        );
        const outcome = await ended;
        expect(outcome).toEqual({ error: expect.any(InternalServerError) });
        const error = (outcome as { error: InternalServerError }).error;
        expect(error.body, "the last failure as it arrived").toEqual(failed.body);
        expect(error.job, "the job as it was last seen, from the upload's answer").toEqual(RUNNING_JOB);
    });

    it("makes each poll one attempt: a 503 naming a wait is not retried inside the poll; the helper waits the named wait itself and checks it against the bound", async () => {
        // The runtime retries a 503 on its own and would wait the named 29 seconds inside the poll, unchecked against the
        // bound; each poll is one attempt instead, so the helper waits the named wait between its tries and begins no
        // try whose wait would end past the bound of 600 seconds and one more minute: 23 polls at 0, 29, ... 638
        // seconds, 22 waits, then the last refusal comes back with the job as last seen.
        const boundMs = (600 + 60) * 1000;
        const waitMs = 29_000;
        // A try begins when the wait before it ends within the bound: at 0, 29, ... 638 seconds (23 polls); the 24th
        // would begin at 667, past 660.
        const triesAllowed: number[] = [];
        for (let at = 0; at <= boundMs; at += waitMs) {
            triesAllowed.push(at);
        }
        const refused: Step = { method: "GET", path: JOB_PATH, ...asksToWait("overloaded", 29) };
        const script = new Script([
            {
                method: "GET",
                path: "/v1/limits",
                status: 200,
                body: limitsWith([{ family: "contents", name: "job_seconds" }, { max: 600 }]),
            },
            ACCEPTED,
            ...triesAllowed.map(() => refused),
        ]);

        const ended = sendWaiting(script);
        await vi.runAllTimersAsync();

        const polls = script.calls().flatMap((call, index) => (call === `GET ${JOB_PATH}` ? [index] : []));
        const first = script.sentAt[polls[0] ?? Number.NaN] ?? Number.NaN;
        const tries = polls.map((index) => (script.sentAt[index] ?? Number.NaN) - first);
        expect(tries, "one poll per try, each after the named wait, none whose wait would end past the bound").toEqual(
            triesAllowed,
        );
        const outcome = await ended;
        expect(outcome).toEqual({ error: expect.any(ServiceUnavailableError) });
        const error = (outcome as { error: GetCleanError }).error;
        expect(error.body, "the last refusal as it arrived").toEqual(refused.body);
        expect(error.job, "the job as it was last seen, from the upload's answer").toEqual(RUNNING_JOB);
    });

    it("ends at once when the caller aborts during its wait between two tries, and sends nothing more", async () => {
        // The helper's own wait ends the moment the caller aborts, as the runtime's waits do: the SDK's error for an
        // aborted request, with no try after it.
        vi.spyOn(Math, "random").mockReturnValue(0.5);
        const controller = new AbortController();
        const script = new Script([
            LIMITS,
            ACCEPTED,
            { method: "GET", path: JOB_PATH, status: 500, body: problem("internal-error") },
            poll(JOB_COMPLETED_WHOLE),
        ]);

        const ended = sendWaiting(script, {}, { abortSignal: controller.signal });
        // The poll fails at once; the caller aborts half a second into the helper's 1-second backoff.
        await vi.advanceTimersByTimeAsync(500);
        controller.abort();
        const outcome = await ended;

        expect(outcome).toEqual({ error: expect.any(GetCleanError) });
        expect(
            (outcome as { error: GetCleanError }).error.constructor,
            "the SDK's own error, no class of a status",
        ).toBe(GetCleanError);
        // Past the end of the backoff, in which another poll would show.
        await vi.advanceTimersByTimeAsync(1000);
        expect(
            script.calls().filter((call) => call === `GET ${JOB_PATH}`),
            "the one failed poll",
        ).toHaveLength(1);
    });

    it("ends the helper at a 4xx on a poll and raises it as it arrived", async () => {
        // A 4xx ends the helper as it arrived; it is not tried again.
        const expired = problem("job-expired");
        const script = new Script([
            LIMITS,
            ACCEPTED,
            poll(RUNNING_JOB),
            { method: "GET", path: JOB_PATH, status: 410, body: expired },
        ]);

        const ended = sendWaiting(script);
        await vi.advanceTimersByTimeAsync(60_000);

        expect(script.calls(), "no poll after the 410").toEqual([
            "GET /v1/limits",
            `POST ${UPLOAD_CONTENTS.path}`,
            `GET ${JOB_PATH}`,
            `GET ${JOB_PATH}`,
        ]);
        const outcome = await ended;
        expect(outcome).toEqual({ error: expect.any(GoneError) });
        expect((outcome as { error: GoneError }).error.body).toEqual(expired);
    });

    it("puts the last job seen on the error a failed poll raises", async () => {
        // A poll's error carries the last job seen, so a caller whose helper failed can read the job later.
        const script = new Script([
            LIMITS,
            ACCEPTED,
            poll(RUNNING_JOB),
            { method: "GET", path: JOB_PATH, status: 404, body: problem("not-found") },
        ]);

        const ended = await sendWaiting(script);

        expect(ended).toEqual({ error: expect.any(GetCleanError) });
        expect((ended as { error: GetCleanError }).error.job, "the last job seen").toEqual(RUNNING_JOB);
    });

    it("ends the helper at the read's 410, the contract's example, and puts the job on the error", async () => {
        // A record that expired before it was read: the 410 of the contract's example ends the helper as it
        // arrived, the completed job on the error.
        const script = new Script([
            LIMITS,
            ACCEPTED,
            poll(JOB_COMPLETED_WHOLE),
            {
                method: "GET",
                path: `/v1/contents/${GET_JOB_COMPLETED.contents_id}`,
                status: 410,
                body: GET_CONTENTS_CONTENTS_EXPIRED,
            },
        ]);

        const ended = await sendWaiting(script);

        expect(ended).toEqual({ error: expect.any(GoneError) });
        const error = (ended as { error: GoneError }).error;
        expect(error.body, "the contract's example as it arrived").toEqual(GET_CONTENTS_CONTENTS_EXPIRED);
        expect(error.job, "the completed job").toEqual(JOB_COMPLETED_WHOLE);
    });
});

describe("the key on the errors of the wait", () => {
    it.each([
        [
            "a poll's 404",
            [poll(RUNNING_JOB), { method: "GET", path: JOB_PATH, status: 404, body: problem("not-found") }],
        ],
        ["the job's problem", [poll(failedJob(jobProblem("internal-error")))]],
        ["JobCanceled", [poll(canceledJobWithoutRecord())]],
        [
            "the read's 410",
            [
                poll(JOB_COMPLETED_WHOLE),
                {
                    method: "GET",
                    path: `/v1/contents/${GET_JOB_COMPLETED.contents_id}`,
                    status: 410,
                    body: GET_CONTENTS_CONTENTS_EXPIRED,
                },
            ],
        ],
    ] as Array<[string, Step[]]>)("puts the upload's key on %s", async (_case, steps) => {
        // The upload is a call that may bill, and every error it raises carries the key it sent, the wait's own
        // errors included, so the caller's repeat of the upload is a replay that gives the same job back.
        const script = new Script([LIMITS, ACCEPTED, ...steps]);

        const ended = await sendWaiting(script);

        const [sent] = script.headers(UPLOAD_CONTENTS.path, "Idempotency-Key");
        expect(sent).toMatch(UUID_V4);
        expect(ended).toEqual({ error: expect.any(GetCleanError) });
        expect((ended as { error: GetCleanError }).error.idempotencyKey, "the upload's key").toBe(sent);
    });
});

describe("a conflict on the upload itself", () => {
    it("retries an in-flight 409 on the upload with the same key before it follows the job", async () => {
        // The upload is a call that may bill: an in-flight 409 is asked again with the same key, then the job is
        // followed.
        const script = new Script([
            LIMITS,
            {
                method: "POST",
                path: UPLOAD_CONTENTS.path,
                status: 409,
                body: problem("idempotency-key-in-flight", { retry_after_seconds: 1 }),
                headers: { "Retry-After": "1" },
            },
            ACCEPTED,
            poll(JOB_COMPLETED_WHOLE),
            read(RECORD_OF_THE_WHOLE_JOB),
        ]);

        const ended = sendWaiting(script);
        await vi.advanceTimersByTimeAsync(1000);

        expect(script.calls().slice(1, 3)).toEqual([`POST ${UPLOAD_CONTENTS.path}`, `POST ${UPLOAD_CONTENTS.path}`]);
        const keys = script.headers(UPLOAD_CONTENTS.path, "Idempotency-Key");
        expect(keys[1], "the retry carries the first attempt's key").toBe(keys[0]);
        const outcome = await ended;
        expect(outcome).toEqual({
            value: {
                contents: RECORD_OF_THE_WHOLE_JOB,
                job: JOB_COMPLETED_WHOLE,
                request_id: UPLOAD_CONTENTS_JOB.request_id,
            },
        });
    });
});
