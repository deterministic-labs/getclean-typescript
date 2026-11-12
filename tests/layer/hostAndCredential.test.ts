/**
 * The host and the credential. The client calls `baseUrl` when one is given, else the host in GETCLEAN_BASE_URL when
 * that is set and not empty, else https://api.getclean.ai. It takes the credential as `apiKey`, a value or a function,
 * else GETCLEAN_API_KEY; with neither, or with an empty one, it fails at construction with the SDK's own error, before
 * any request. A credential function is called once per call, before its first attempt, and every attempt of the call
 * carries what it returned; a later page and each poll of the wait helper are calls of their own.
 */

import { GetClean, GetCleanError } from "../../src/index.js";
import {
    CANCEL_JOB_CANCELED,
    GET_JOB_COMPLETED,
    GET_LIMITS_LIMITS,
    LIST_JOBS_FIRST_PAGE,
    UPLOAD_CONTENTS_JOB,
} from "./examples.js";
import {
    FETCH_CONTENTS,
    JOB_COMPLETED_WHOLE,
    MINUTES_PDF,
    pageToken,
    problem,
    RECORD_OF_THE_WHOLE_JOB,
    RUNNING_JOB,
    Script,
    type Step,
    settle,
    UPLOAD_CONTENTS,
} from "./support.js";

beforeEach(() => {
    vi.useFakeTimers();
    // The tests set the two variables themselves, whatever the shell running them holds.
    vi.stubEnv("GETCLEAN_BASE_URL", undefined);
    vi.stubEnv("GETCLEAN_API_KEY", undefined);
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
});

/** The production host, the contract's one server. */
const PRODUCTION = "https://api.getclean.ai";

/** A host the variable names, reserved for testing (RFC 6761). */
const FROM_THE_ENVIRONMENT = "http://from-the-environment.getclean.test";

/** A host the caller passes, reserved for testing (RFC 6761). */
const FROM_THE_ARGUMENT = "http://from-the-argument.getclean.test";

/** The contract's completed job (`get_job.completed`), the answer of the one call these tests make. */
const JOB_ID = GET_JOB_COMPLETED.id;
const JOB_ANSWER: Step = { method: "GET", path: `/v1/jobs/${JOB_ID}`, status: 200, body: GET_JOB_COMPLETED };

/** What a call throws, or a failure when it throws nothing. */
function thrownBy(call: () => unknown): unknown {
    try {
        call();
    } catch (error) {
        return error;
    }
    throw new Error("nothing was thrown");
}

describe("the host", () => {
    it("calls the host GETCLEAN_BASE_URL names when no baseUrl is given", async () => {
        // The host comes from GETCLEAN_BASE_URL when one is set.
        vi.stubEnv("GETCLEAN_BASE_URL", FROM_THE_ENVIRONMENT);
        const script = new Script([JOB_ANSWER]);

        await new GetClean({ apiKey: "a-test-key", fetch: script.fetch }).getJob(JOB_ID);

        expect(script.urls).toEqual([`${FROM_THE_ENVIRONMENT}/v1/jobs/${JOB_ID}`]);
    });

    it("calls the baseUrl given over the host GETCLEAN_BASE_URL names", async () => {
        // The argument wins over the variable.
        vi.stubEnv("GETCLEAN_BASE_URL", FROM_THE_ENVIRONMENT);
        const script = new Script([JOB_ANSWER]);

        await new GetClean({ apiKey: "a-test-key", baseUrl: FROM_THE_ARGUMENT, fetch: script.fetch }).getJob(JOB_ID);

        expect(script.urls).toEqual([`${FROM_THE_ARGUMENT}/v1/jobs/${JOB_ID}`]);
    });

    it("calls the production host when GETCLEAN_BASE_URL is empty", async () => {
        // An empty variable names no host: it is passed over for the production host.
        vi.stubEnv("GETCLEAN_BASE_URL", "");
        const script = new Script([JOB_ANSWER]);

        const ended = await settle(new GetClean({ apiKey: "a-test-key", fetch: script.fetch }).getJob(JOB_ID));

        expect(script.urls).toEqual([`${PRODUCTION}/v1/jobs/${JOB_ID}`]);
        expect(ended).toEqual({ value: GET_JOB_COMPLETED });
    });

    it("calls the production host when neither baseUrl nor GETCLEAN_BASE_URL is given", async () => {
        // The contract's one server is the default.
        const script = new Script([JOB_ANSWER]);

        await new GetClean({ apiKey: "a-test-key", fetch: script.fetch }).getJob(JOB_ID);

        expect(script.urls).toEqual([`${PRODUCTION}/v1/jobs/${JOB_ID}`]);
    });
});

describe("a missing credential", () => {
    it("fails at construction with the SDK's own error, saying what to do, when neither apiKey nor GETCLEAN_API_KEY is given", () => {
        // No credential is a fault of the program's configuration: the SDK's own error, no HTTP class and no
        // status, before any request, its text saying to pass the key to the client or to set the variable.
        const script = new Script([JOB_ANSWER]);

        const error = thrownBy(() => new GetClean({ fetch: script.fetch }));

        expect(error).toBeInstanceOf(GetCleanError);
        expect((error as GetCleanError).constructor, "the SDK's base error itself").toBe(GetCleanError);
        expect((error as GetCleanError).statusCode, "no status: no request was made").toBeUndefined();
        expect((error as GetCleanError).message).toMatch(/\bapiKey\b.*\bpass\b.*\bclient\b/);
        expect((error as GetCleanError).message).toMatch(/\bset\b.*\bGETCLEAN_API_KEY\b/);
        expect(script.urls, "no request").toEqual([]);
    });

    it.each([
        ["an empty apiKey", { apiKey: "" }, undefined],
        ["an empty GETCLEAN_API_KEY", {}, ""],
    ])("fails at construction with the same error when given %s", (_case, options, variable) => {
        // An empty credential is no credential: the SDK's own error, and no empty bearer value leaves.
        vi.stubEnv("GETCLEAN_API_KEY", variable);
        const script = new Script([JOB_ANSWER]);

        const error = thrownBy(() => new GetClean({ ...options, fetch: script.fetch }));

        expect(error).toBeInstanceOf(GetCleanError);
        expect((error as GetCleanError).constructor, "the SDK's base error itself").toBe(GetCleanError);
        expect((error as GetCleanError).statusCode, "no status: no request was made").toBeUndefined();
        expect((error as GetCleanError).message).toMatch(/\bapiKey\b.*\bpass\b.*\bclient\b/);
        expect((error as GetCleanError).message).toMatch(/\bset\b.*\bGETCLEAN_API_KEY\b/);
        expect(script.urls, "no request").toEqual([]);
    });

    it("sends no request when the credential function returns an empty value", async () => {
        // No empty bearer value leaves: a function that returns nothing to send fails the call with the SDK's own
        // error before its request.
        const script = new Script([JOB_ANSWER]);

        const ended = await settle(new GetClean({ apiKey: () => "", fetch: script.fetch }).getJob(JOB_ID));

        expect(script.urls, "no request").toEqual([]);
        expect(ended).toEqual({ error: expect.any(GetCleanError) });
        const error = (ended as { error: GetCleanError }).error;
        expect(error.constructor, "the SDK's base error itself").toBe(GetCleanError);
        expect(error.message, "the text of a missing credential").toMatch(/\bset\b.*\bGETCLEAN_API_KEY\b/);
    });
});

describe("a credential function", () => {
    /** A credential function that hands out a new token each time it is called, and counts the calls. */
    function tokens(): { apiKey: () => string; calls: () => number } {
        let count = 0;
        return {
            apiKey: () => {
                count += 1;
                return `token-${count}`;
            },
            calls: () => count,
        };
    }

    it("runs once for the reading of the limits and once for the billed call after it, each request with its own value, then once a call", async () => {
        // The reading of the limits is a call of the SDK's own: the first billed call runs the function for it and for
        // itself, each request carrying the value returned for it, in order; a later billed call, with the limits
        // read, runs it once.
        const credential = tokens();
        const answered: Step = {
            method: "POST",
            path: FETCH_CONTENTS.path,
            status: FETCH_CONTENTS.status,
            body: FETCH_CONTENTS.answer,
        };
        const script = new Script([
            { method: "GET", path: "/v1/limits", status: 200, body: GET_LIMITS_LIMITS },
            answered,
            answered,
        ]);
        const client = script.client({ apiKey: credential.apiKey });

        await FETCH_CONTENTS.send(client);

        expect(credential.calls(), "twice for the first billed call").toBe(2);
        expect(script.headers("/v1/limits", "Authorization"), "the first value, on the reading").toEqual([
            "Bearer token-1",
        ]);
        expect(script.headers(FETCH_CONTENTS.path, "Authorization"), "the second value, on the call").toEqual([
            "Bearer token-2",
        ]);

        await FETCH_CONTENTS.send(client);

        expect(credential.calls(), "once for the second billed call").toBe(3);
        expect(script.headers(FETCH_CONTENTS.path, "Authorization")).toEqual(["Bearer token-2", "Bearer token-3"]);
    });

    it("is called once for a call that may bill, every attempt carrying its token, the retries of a 429 and of an in-flight 409 alike", async () => {
        // The function is called once per logical call before its first attempt, and the retries of that call
        // reuse what it returned.
        const credential = tokens();
        const script = new Script([
            { method: "GET", path: "/v1/limits", status: 200, body: GET_LIMITS_LIMITS },
            { method: "POST", path: FETCH_CONTENTS.path, status: 201, body: FETCH_CONTENTS.answer },
            {
                method: "POST",
                path: FETCH_CONTENTS.path,
                status: 429,
                body: problem("rate-limit-exceeded", { retry_after_seconds: 1 }),
                headers: { "Retry-After": "1" },
            },
            {
                method: "POST",
                path: FETCH_CONTENTS.path,
                status: 409,
                body: problem("idempotency-key-in-flight", { retry_after_seconds: 1 }),
                headers: { "Retry-After": "1" },
            },
            { method: "POST", path: FETCH_CONTENTS.path, status: 201, body: FETCH_CONTENTS.answer },
        ]);
        const client = script.client({ apiKey: credential.apiKey });
        // A first call reads the limits, so the call measured below is a billed call alone.
        await FETCH_CONTENTS.send(client);
        const before = credential.calls();

        const ended = settle(FETCH_CONTENTS.send(client));
        await vi.advanceTimersByTimeAsync(1000);
        await vi.advanceTimersByTimeAsync(1000);

        expect(script.calls().slice(2)).toEqual([
            `POST ${FETCH_CONTENTS.path}`,
            `POST ${FETCH_CONTENTS.path}`,
            `POST ${FETCH_CONTENTS.path}`,
        ]);
        expect(credential.calls() - before, "one call of the function for the whole call").toBe(1);
        const sent = script.headers(FETCH_CONTENTS.path, "Authorization").slice(1);
        expect(sent, "the three attempts carry one token").toEqual([sent[0], sent[0], sent[0]]);
        expect(await ended).toEqual({ value: FETCH_CONTENTS.answer });
    });

    it("is called again for a later page of a pager, a call of its own", async () => {
        // A later page is a new call, which calls the function again.
        const credential = tokens();
        // The contract's list of jobs as the first of two pages, with a token to the second; the second lists the
        // contract's canceled job under the second page's own request id, the first's with its last character changed.
        const secondPage = `${LIST_JOBS_FIRST_PAGE.request_id.slice(0, -1)}2`;
        const script = new Script([
            {
                method: "GET",
                path: "/v1/jobs",
                status: 200,
                body: { ...LIST_JOBS_FIRST_PAGE, next_page_token: pageToken("jobs", 1) },
            },
            {
                method: "GET",
                path: "/v1/jobs",
                status: 200,
                body: {
                    jobs: [{ ...CANCEL_JOB_CANCELED, request_id: secondPage }],
                    notices: [],
                    request_id: secondPage,
                },
            },
        ]);

        const first = await script.client({ apiKey: credential.apiKey }).listJobs();
        await first.getNextPage();

        expect(credential.calls(), "once a page").toBe(2);
        expect(script.headers("/v1/jobs", "Authorization")).toEqual(["Bearer token-1", "Bearer token-2"]);
    });

    it("is called again for each poll of the wait helper, so every request carries a live token", async () => {
        // A caller that refreshes hands every request a live token, the wait helper's polls included.
        const credential = tokens();
        const jobPath = `/v1/jobs/${RUNNING_JOB.id}`;
        const script = new Script([
            { method: "GET", path: "/v1/limits", status: 200, body: GET_LIMITS_LIMITS },
            { method: "POST", path: UPLOAD_CONTENTS.path, status: 202, body: UPLOAD_CONTENTS_JOB },
            { method: "GET", path: jobPath, status: 200, body: RUNNING_JOB },
            { method: "GET", path: jobPath, status: 200, body: JOB_COMPLETED_WHOLE },
            {
                method: "GET",
                path: `/v1/contents/${RECORD_OF_THE_WHOLE_JOB.id}`,
                status: 200,
                body: RECORD_OF_THE_WHOLE_JOB,
            },
        ]);

        await script
            .client({ apiKey: credential.apiKey })
            .uploadContents({ document: Buffer.from(MINUTES_PDF), wait: true });

        const [uploaded] = script.headers(UPLOAD_CONTENTS.path, "Authorization");
        const polls = script.headers(jobPath, "Authorization");
        const [read] = script.headers(`/v1/contents/${RECORD_OF_THE_WHOLE_JOB.id}`, "Authorization");
        expect(polls, "two polls").toHaveLength(2);
        expect(
            new Set([uploaded, ...polls, read]).size,
            "a token of its own for the upload, each poll and the read",
        ).toBe(4);
    });
});
