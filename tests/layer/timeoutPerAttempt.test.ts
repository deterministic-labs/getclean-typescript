/**
 * The timeout per attempt. Before the first call that may bill, the client reads the limits; each attempt of a billed
 * call then runs under the operation's own published bound plus 10 seconds, and under 120 seconds while the limits
 * are unread. A timeout set by the caller, on the call or on the client, stands. A reading that fails never fails the
 * call: it leaves the defaults, is tried again before the next billed call after a transient fault, and never again
 * after a 401 or a 403.
 *
 * Each timeout is measured on the request itself: an attempt the server never answers is cut by the client, and the
 * scripted server records how long it lived.
 */

import { GetClean, GetCleanError, GetCleanTimeoutError } from "../../src/index.js";
import { GET_LIMITS_LIMITS } from "./examples.js";
import {
    asksToWait,
    BASE_URL,
    BILLED_CALLS,
    FETCH_CONTENTS,
    limitsWith,
    problem,
    Script,
    type Step,
    settle,
} from "./support.js";

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

/**
 * The contract's limits example with one bound changed: the contents family's `call_seconds` is 80 in place of the
 * example's 110, whose sum with the margin, 120, equals the timeout before the limits are read, so a test of the
 * reading could not tell the two apart.
 */
const READ_LIMITS = limitsWith([{ family: "contents", name: "call_seconds" }, { max: 80 }]);

/** The bounds that time each call once those limits are read, in seconds: the changed one and the example's others. */
const READ_BOUNDS = {
    contents: { call_seconds: 80, batch_seconds: GET_LIMITS_LIMITS.bounds.contents.batch_seconds.max },
    search: {
        call_seconds: GET_LIMITS_LIMITS.bounds.search.call_seconds.max,
        batch_seconds: GET_LIMITS_LIMITS.bounds.search.batch_seconds.max,
    },
};

/** The timeout of every attempt while the limits are unread, in seconds. */
const UNREAD_TIMEOUT_SECONDS = 120;

/** The margin the client adds to a published bound, in seconds. */
const MARGIN_SECONDS = 10;

/** A call cut by its timeout ends with the SDK's timeout error. */
const TIMED_OUT = { error: expect.any(GetCleanTimeoutError) };

describe("before the limits are read", () => {
    it.each(
        BILLED_CALLS,
    )("$method reads the limits once, then runs its attempt under 120 seconds when they cannot be read", async (call) => {
        // The limits are read before the first call that may bill; while unread, an attempt is cut at 120 seconds. A
        // key without the scope to read them meets a 403.
        const script = new Script([
            { method: "GET", path: "/v1/limits", status: 403, body: problem("insufficient-scope") },
            { method: "POST", path: call.path, never: true },
        ]);

        const ended = settle(call.send(script.client()));
        await vi.advanceTimersByTimeAsync(UNREAD_TIMEOUT_SECONDS * 1000);

        expect(script.calls()).toEqual(["GET /v1/limits", `POST ${call.path}`]);
        expect(script.lifetime(1), "the attempt is cut at 120 seconds").toBe(UNREAD_TIMEOUT_SECONDS * 1000);
        expect(await ended).toEqual(TIMED_OUT);
    });
});

describe("once the limits are read", () => {
    it.each(
        BILLED_CALLS,
    )("$method runs each attempt under its own bound from the limits plus 10 seconds", async (call) => {
        // The two batches run under their family's batch_seconds, every other billed call under its family's
        // call_seconds, each plus 10 seconds.
        const seconds = READ_BOUNDS[call.family][call.bound] + MARGIN_SECONDS;
        const script = new Script([
            { method: "GET", path: "/v1/limits", status: 200, body: READ_LIMITS },
            { method: "POST", path: call.path, never: true },
        ]);

        const ended = settle(call.send(script.client()));
        await vi.advanceTimersByTimeAsync(seconds * 1000);

        expect(script.calls()).toEqual(["GET /v1/limits", `POST ${call.path}`]);
        expect(script.lifetime(1), `the attempt is cut at ${call.family}.${call.bound} plus 10`).toBe(seconds * 1000);
        expect(await ended).toEqual(TIMED_OUT);
    });

    it("runs each attempt of a retried call under the same timeout, counted from that attempt", async () => {
        // The timeout bounds each attempt, not the call: the attempt after a 503 has its whole 90 seconds, whatever
        // the first attempt took.
        const script = new Script([
            { method: "GET", path: "/v1/limits", status: 200, body: READ_LIMITS },
            { method: "POST", path: FETCH_CONTENTS.path, waitSeconds: 60, ...asksToWait("overloaded", 1) },
            { method: "POST", path: FETCH_CONTENTS.path, never: true },
        ]);

        const ended = settle(FETCH_CONTENTS.send(script.client()));
        await vi.advanceTimersByTimeAsync(60_000 + 1000);
        await vi.advanceTimersByTimeAsync(90_000);

        expect(script.calls()).toEqual([
            "GET /v1/limits",
            `POST ${FETCH_CONTENTS.path}`,
            `POST ${FETCH_CONTENTS.path}`,
        ]);
        expect(script.lifetime(2), "the second attempt is cut 90 seconds after it began").toBe(90_000);
        expect(await ended).toEqual(TIMED_OUT);
    });

    it.each([
        // The example's contents bounds with call_seconds left out.
        [
            "no call_seconds in the contents bounds",
            limitsWith([{ family: "contents", name: "call_seconds" }, undefined]),
        ],
        // The example's contents call_seconds with its max left out.
        ["a call_seconds bound without a max", limitsWith([{ family: "contents", name: "call_seconds" }, {}])],
    ])("runs an attempt under 120 seconds when the limits carry %s", async (_case, readLimits) => {
        // Limits without the bound leave the timeout of the unread limits, 120 seconds, and raise nothing.
        const script = new Script([
            { method: "GET", path: "/v1/limits", status: 200, body: readLimits },
            { method: "POST", path: FETCH_CONTENTS.path, never: true },
        ]);

        const ended = settle(FETCH_CONTENTS.send(script.client()));
        await vi.advanceTimersByTimeAsync(UNREAD_TIMEOUT_SECONDS * 1000);

        expect(script.calls()).toEqual(["GET /v1/limits", `POST ${FETCH_CONTENTS.path}`]);
        expect(script.lifetime(1)).toBe(UNREAD_TIMEOUT_SECONDS * 1000);
        expect(await ended).toEqual(TIMED_OUT);
    });
});

describe("a timeout the caller sets", () => {
    it.each(BILLED_CALLS)("$method keeps the timeout given in its request options", async (call) => {
        // A caller's own timeout for the call stands; the layer's is not applied.
        const script = new Script([
            { method: "GET", path: "/v1/limits", status: 200, body: READ_LIMITS },
            { method: "POST", path: call.path, never: true },
        ]);

        const ended = settle(call.send(script.client(), undefined, { timeoutInSeconds: 5 }));
        await vi.advanceTimersByTimeAsync(5000);

        expect(script.calls()).toEqual(["GET /v1/limits", `POST ${call.path}`]);
        expect(script.lifetime(1), "the caller's 5 seconds").toBe(5000);
        expect(await ended).toEqual(TIMED_OUT);
    });

    it.each(BILLED_CALLS)("$method keeps the timeout the client was built with", async (call) => {
        // The layer's timeout applies only when neither the call nor the client's construction set one.
        const script = new Script([
            { method: "GET", path: "/v1/limits", status: 200, body: READ_LIMITS },
            { method: "POST", path: call.path, never: true },
        ]);

        const ended = settle(call.send(script.client({ timeoutInSeconds: 45 })));
        await vi.advanceTimersByTimeAsync(45_000);

        expect(script.calls()).toEqual(["GET /v1/limits", `POST ${call.path}`]);
        expect(script.lifetime(1), "the client's 45 seconds").toBe(45_000);
        expect(await ended).toEqual(TIMED_OUT);
    });
});

/**
 * A failed reading of the limits: the steps the server answers it with, and how long the runtime waits between them,
 * in milliseconds of the test's clock.
 */
type LimitsFault = { fault: string; steps: Step[]; waitMs: number };

/**
 * The runtime asks again after a 429 or a 503, four times at most, each after the wait the answer names: a reading
 * that meets one on every attempt is five requests and four waits of one second, the least the contract allows.
 */
function onEveryAttempt(name: string): Pick<LimitsFault, "steps" | "waitMs"> {
    const step: Step = { method: "GET", path: "/v1/limits", ...asksToWait(name, 1) };
    return { steps: [step, step, step, step, step], waitMs: 4 * 1000 };
}

const PASSING_FAULTS: LimitsFault[] = [
    { fault: "a 429 on every attempt", ...onEveryAttempt("rate-limit-exceeded") },
    {
        fault: "a 500",
        steps: [{ method: "GET", path: "/v1/limits", status: 500, body: problem("internal-error") }],
        waitMs: 0,
    },
    { fault: "a 503 on every attempt", ...onEveryAttempt("overloaded") },
    {
        fault: "a transport failure",
        steps: [{ method: "GET", path: "/v1/limits", transportError: new TypeError("fetch failed") }],
        waitMs: 0,
    },
    {
        fault: "an answer that does not parse",
        steps: [{ method: "GET", path: "/v1/limits", status: 200, rawBody: "{ not json" }],
        waitMs: 0,
    },
];

const REFUSALS: LimitsFault[] = [
    {
        fault: "a 401",
        steps: [{ method: "GET", path: "/v1/limits", status: 401, body: problem("unauthorized") }],
        waitMs: 0,
    },
    {
        fault: "a 403",
        steps: [{ method: "GET", path: "/v1/limits", status: 403, body: problem("insufficient-scope") }],
        waitMs: 0,
    },
];

describe("a reading of the limits that fails", () => {
    it.each([...PASSING_FAULTS, ...REFUSALS])("returns the call's own answer whole after $fault", async ({
        steps,
        waitMs,
    }) => {
        // A failed reading never fails the billed call: the call goes out and its own answer comes back whole.
        const script = new Script([
            ...steps,
            { method: "POST", path: FETCH_CONTENTS.path, status: FETCH_CONTENTS.status, body: FETCH_CONTENTS.answer },
        ]);

        const ended = settle(FETCH_CONTENTS.send(script.client()));
        await vi.advanceTimersByTimeAsync(waitMs);

        expect(script.calls()).toEqual([...steps.map(() => "GET /v1/limits"), `POST ${FETCH_CONTENTS.path}`]);
        expect(await ended).toEqual({ value: FETCH_CONTENTS.answer });
    });

    it.each(PASSING_FAULTS)("runs the call under 120 seconds after $fault, since the limits stay unread", async ({
        steps,
        waitMs,
    }) => {
        // The defaults a failed reading leaves include the timeout: the call's attempt is cut at 120 seconds.
        const script = new Script([...steps, { method: "POST", path: FETCH_CONTENTS.path, never: true }]);

        const ended = settle(FETCH_CONTENTS.send(script.client()));
        await vi.advanceTimersByTimeAsync(waitMs);
        await vi.advanceTimersByTimeAsync(UNREAD_TIMEOUT_SECONDS * 1000);

        expect(script.calls()).toEqual([...steps.map(() => "GET /v1/limits"), `POST ${FETCH_CONTENTS.path}`]);
        expect(script.lifetime(steps.length), "the call's attempt is cut at 120 seconds").toBe(
            UNREAD_TIMEOUT_SECONDS * 1000,
        );
        expect(await ended).toEqual(TIMED_OUT);
    });

    it.each(
        PASSING_FAULTS,
    )("reads the limits again before the next billed call after $fault, and the reading sets the timeout", async ({
        steps,
        waitMs,
    }) => {
        // After a transient fault the limits are read again before the next billed call; once read, they set the
        // timeout.
        const script = new Script([
            ...steps,
            { method: "POST", path: FETCH_CONTENTS.path, status: FETCH_CONTENTS.status, body: FETCH_CONTENTS.answer },
            { method: "GET", path: "/v1/limits", status: 200, body: READ_LIMITS },
            { method: "POST", path: FETCH_CONTENTS.path, never: true },
        ]);
        const client = script.client();

        const first = settle(FETCH_CONTENTS.send(client));
        await vi.advanceTimersByTimeAsync(waitMs);
        expect(await first).toEqual({ value: FETCH_CONTENTS.answer });
        const second = settle(FETCH_CONTENTS.send(client));
        await vi.advanceTimersByTimeAsync(90_000);

        expect(script.calls()).toEqual([
            ...steps.map(() => "GET /v1/limits"),
            `POST ${FETCH_CONTENTS.path}`,
            "GET /v1/limits",
            `POST ${FETCH_CONTENTS.path}`,
        ]);
        expect(script.lifetime(steps.length + 2), "the bound read the second time, 80 plus 10").toBe(90_000);
        expect(await second).toEqual(TIMED_OUT);
    });

    it.each(REFUSALS)("never reads the limits again for the client's life after $fault", async ({ steps }) => {
        // A key refused the limits keeps being refused, so after a 401 or a 403 the client reads them no more and
        // its billed calls run under 120 seconds.
        const script = new Script([
            ...steps,
            { method: "POST", path: FETCH_CONTENTS.path, status: FETCH_CONTENTS.status, body: FETCH_CONTENTS.answer },
            { method: "POST", path: FETCH_CONTENTS.path, never: true },
        ]);
        const client = script.client();

        expect(await settle(FETCH_CONTENTS.send(client))).toEqual({ value: FETCH_CONTENTS.answer });
        const second = settle(FETCH_CONTENTS.send(client));
        await vi.advanceTimersByTimeAsync(UNREAD_TIMEOUT_SECONDS * 1000);

        expect(script.calls()).toEqual([
            "GET /v1/limits",
            `POST ${FETCH_CONTENTS.path}`,
            `POST ${FETCH_CONTENTS.path}`,
        ]);
        expect(script.lifetime(2)).toBe(UNREAD_TIMEOUT_SECONDS * 1000);
        expect(await second).toEqual(TIMED_OUT);
    });
});

/** A trace context of the W3C example form, sent as a caller sends it, through the request options. */
const TRACEPARENT = "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01";

describe("the reading of the limits itself", () => {
    it("carries the headers of the call that caused it and none of its query", async () => {
        // The reading carries the headers of the billed call that caused it and none of its other options.
        const script = new Script([
            { method: "GET", path: "/v1/limits", status: 200, body: READ_LIMITS },
            { method: "POST", path: FETCH_CONTENTS.path, status: FETCH_CONTENTS.status, body: FETCH_CONTENTS.answer },
        ]);

        const ended = await settle(
            FETCH_CONTENTS.send(script.client(), undefined, {
                headers: { traceparent: TRACEPARENT },
                queryParams: { trace: "on" },
            }),
        );

        expect(script.calls()).toEqual(["GET /v1/limits", `POST ${FETCH_CONTENTS.path}`]);
        expect(script.headers("/v1/limits", "traceparent"), "the call's headers on the reading").toEqual([TRACEPARENT]);
        expect(script.query(0), "none of the call's query on the reading").toEqual([]);
        expect(script.query(1), "the call keeps its own query").toEqual([["trace", "on"]]);
        expect(ended).toEqual({ value: FETCH_CONTENTS.answer });
    });

    it("runs under the client's timeout, not the timeout the caller set for the call", async () => {
        // The caller's timeout is the call's, not the reading's: a reading that hangs is cut at the client's 120
        // seconds, then the call goes out under the caller's 5.
        const script = new Script([
            { method: "GET", path: "/v1/limits", never: true },
            { method: "POST", path: FETCH_CONTENTS.path, never: true },
        ]);

        const ended = settle(FETCH_CONTENTS.send(script.client(), undefined, { timeoutInSeconds: 5 }));
        await vi.advanceTimersByTimeAsync(UNREAD_TIMEOUT_SECONDS * 1000);
        await vi.advanceTimersByTimeAsync(5000);

        expect(script.calls()).toEqual(["GET /v1/limits", `POST ${FETCH_CONTENTS.path}`]);
        expect(script.lifetime(0), "the reading, under the client's timeout").toBe(UNREAD_TIMEOUT_SECONDS * 1000);
        expect(script.lifetime(1), "the call, under the caller's").toBe(5000);
        expect(await ended).toEqual(TIMED_OUT);
    });

    it("carries the caller's abort signal: an abort while the limits are read ends the reading with the call", async () => {
        // The reading is the call's own first step, so the caller's abort ends it as it ends the call: a caller does
        // not wait up to 120 seconds for a reading it no longer wants. The server waits 5 seconds before it answers
        // the reading; the caller aborts after 1.
        const controller = new AbortController();
        const script = new Script([
            { method: "GET", path: "/v1/limits", status: 200, body: READ_LIMITS, waitSeconds: 5 },
            { method: "POST", path: FETCH_CONTENTS.path, status: FETCH_CONTENTS.status, body: FETCH_CONTENTS.answer },
        ]);

        const ended = settle(FETCH_CONTENTS.send(script.client(), undefined, { abortSignal: controller.signal }));
        await vi.advanceTimersByTimeAsync(1000);
        controller.abort();
        await vi.advanceTimersByTimeAsync(4000);

        expect(script.calls(), "the reading only: the aborted call sends nothing").toEqual(["GET /v1/limits"]);
        expect(script.lifetime(0), "the reading ended with the abort, after one second").toBe(1000);
        const outcome = await ended;
        expect(outcome).toEqual({ error: expect.any(GetCleanError) });
        expect(
            (outcome as { error: GetCleanError }).error.constructor,
            "the SDK's own error, no class of a status",
        ).toBe(GetCleanError);
    });

    it("does not carry the caller's retry count: a reading that meets a 503 is asked again under the client's count", async () => {
        // The call's maxRetries of 0 is the call's: the reading meets a 503 asking for one second, is asked again,
        // and its bound, 80 plus 10, times the call.
        const script = new Script([
            { method: "GET", path: "/v1/limits", ...asksToWait("overloaded", 1) },
            { method: "GET", path: "/v1/limits", status: 200, body: READ_LIMITS },
            { method: "POST", path: FETCH_CONTENTS.path, never: true },
        ]);

        const ended = settle(FETCH_CONTENTS.send(script.client(), undefined, { maxRetries: 0 }));
        await vi.advanceTimersByTimeAsync(1000);
        await vi.advanceTimersByTimeAsync(90_000);

        expect(script.calls()).toEqual(["GET /v1/limits", "GET /v1/limits", `POST ${FETCH_CONTENTS.path}`]);
        expect(script.lifetime(2), "the call under the bound the second reading gave").toBe(90_000);
        expect(await ended).toEqual(TIMED_OUT);
    });

    it("is made at most twice by two billed calls started at once, and each call goes out", async () => {
        // Two billed calls started together before the limits are read both go out; the limits are read once or
        // twice, never more.
        const sent: string[] = [];
        const client = new GetClean({
            apiKey: "a-test-key",
            baseUrl: BASE_URL,
            fetch: async (input, init) => {
                const request = new Request(input, init);
                const path = new URL(request.url).pathname;
                sent.push(`${request.method} ${path}`);
                const body = path === "/v1/limits" ? READ_LIMITS : FETCH_CONTENTS.answer;
                return new Response(JSON.stringify(body), {
                    status: path === "/v1/limits" ? 200 : FETCH_CONTENTS.status,
                    headers: { "Content-Type": "application/json" },
                });
            },
        });

        const answers = await Promise.all([settle(FETCH_CONTENTS.send(client)), settle(FETCH_CONTENTS.send(client))]);

        expect(sent.filter((call) => call === `POST ${FETCH_CONTENTS.path}`)).toHaveLength(2);
        expect([1, 2], "the readings of the limits").toContain(sent.filter((call) => call === "GET /v1/limits").length);
        expect(answers).toEqual([{ value: FETCH_CONTENTS.answer }, { value: FETCH_CONTENTS.answer }]);
    });
});
