/**
 * The retries of a call that may bill. The client asks again, with the same key, after a 429, a 502, a 503, a 504 and a
 * 409 whose problem type is idempotency-key-in-flight: after the wait the answer names in Retry-After, or, when it
 * names none, after a backoff that doubles from 1 second, varied at random and never past 30 seconds. A wait longer
 * than 30 seconds ends the retries, and the answer comes back as it arrived. One call makes at most five attempts,
 * counted across every answer that is retried, and the caller's retry setting governs that count. Every other 409 is
 * raised at once, and a caller's abort ends a wait with no attempt after it.
 */

import {
    BadGatewayError,
    ConflictError,
    GatewayTimeoutError,
    TooManyRequestsError,
} from "../../src/api/errors/index.js";
import { GetCleanError } from "../../src/index.js";
import { FETCH_CONTENTS_INVALID_FIELD, GET_LIMITS_LIMITS } from "./examples.js";
import {
    asksToWait,
    type BilledCall,
    FETCH_CONTENTS,
    FILL_SCHEMA,
    HIGHLIGHT_CONTENTS,
    problem,
    Script,
    type Step,
    SUMMARIZE_CONTENTS,
    settle,
    statusOf,
    UUID_V4,
} from "./support.js";

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

const LIMITS: Step = { method: "GET", path: "/v1/limits", status: 200, body: GET_LIMITS_LIMITS };
const ANSWERED: Step = {
    method: "POST",
    path: FETCH_CONTENTS.path,
    status: FETCH_CONTENTS.status,
    body: FETCH_CONTENTS.answer,
};

/** The longest wait the client takes by itself before an attempt, in milliseconds: no retry can come later than this. */
const LONGEST_WAIT_MS = 30_000;

/**
 * The request id of the answer to attempt `attempt`: the contract's problem example's, with its last character changed
 * to the attempt's number, so the answers can be told apart.
 */
function requestIdOf(attempt: number): string {
    return `${FETCH_CONTENTS_INVALID_FIELD.request_id.slice(0, -1)}${attempt}`;
}

/** The body of the in-flight 409 answering attempt `attempt`, asking for a wait of `waitSeconds`. */
function inFlightBody(attempt: number, waitSeconds: number): Record<string, unknown> {
    return problem("idempotency-key-in-flight", {
        request_id: requestIdOf(attempt),
        instance: `https://api.getclean.ai/requests/${requestIdOf(attempt)}`,
        retry_after_seconds: waitSeconds,
    });
}

/** The in-flight 409 answering attempt `attempt` of fetchContents, naming its wait in Retry-After and in the body. */
function inFlight(attempt: number, waitSeconds: number): Step {
    return {
        method: "POST",
        path: FETCH_CONTENTS.path,
        status: 409,
        body: inFlightBody(attempt, waitSeconds),
        headers: { "Retry-After": String(waitSeconds) },
    };
}

/**
 * The 502 of a model step answering attempt `attempt` of a call: the contract's 502 names no wait, so the client takes
 * its backoff.
 */
function gatewayError(call: BilledCall, attempt: number): Step {
    return {
        method: "POST",
        path: call.path,
        status: 502,
        body: problem("gateway-error", {
            request_id: requestIdOf(attempt),
            instance: `https://api.getclean.ai/requests/${requestIdOf(attempt)}`,
        }),
    };
}

/** The attempts a call has sent so far. */
function attemptsOf(script: Script, call: BilledCall = FETCH_CONTENTS): number {
    return script.calls().filter((sent) => sent === `POST ${call.path}`).length;
}

describe("a wait the answer names", () => {
    it("waits the 2 seconds Retry-After asks for, then returns the next attempt's answer", async () => {
        // An in-flight 409 is asked again after the server's wait, with the same key.
        const script = new Script([LIMITS, inFlight(1, 2), ANSWERED]);

        const ended = settle(FETCH_CONTENTS.send(script.client()));
        await vi.advanceTimersByTimeAsync(1999);
        expect(attemptsOf(script), "no attempt before the 2 seconds pass").toBe(1);
        await vi.advanceTimersByTimeAsync(1);

        expect(attemptsOf(script), "the second attempt at 2 seconds").toBe(2);
        expect(await ended).toEqual({ value: FETCH_CONTENTS.answer });
    });

    it("honors a Retry-After of 30 seconds as sent", async () => {
        // A wait within the 30-second ceiling is honored as the server sent it.
        const script = new Script([LIMITS, inFlight(1, 30), ANSWERED]);

        const ended = settle(FETCH_CONTENTS.send(script.client()));
        await vi.advanceTimersByTimeAsync(29_999);
        expect(attemptsOf(script), "no attempt before the 30 seconds pass").toBe(1);
        await vi.advanceTimersByTimeAsync(1);

        expect(attemptsOf(script), "the second attempt at 30 seconds").toBe(2);
        expect(await ended).toEqual({ value: FETCH_CONTENTS.answer });
    });

    it("ends the retries at a Retry-After of 31 seconds and raises the 409 as it arrived", async () => {
        // A wait past the ceiling is the caller's to take: no retry, and the 409 comes back with its
        // retry_after_seconds on the body.
        const script = new Script([LIMITS, inFlight(1, 31)]);

        const ended = settle(FETCH_CONTENTS.send(script.client()));
        await vi.advanceTimersByTimeAsync(31_000);

        expect(script.calls(), "one attempt, no retry").toEqual(["GET /v1/limits", `POST ${FETCH_CONTENTS.path}`]);
        const outcome = await ended;
        expect(outcome).toEqual({ error: expect.any(ConflictError) });
        const error = (outcome as { error: ConflictError }).error;
        expect(error.statusCode).toBe(409);
        expect(error.body, "the body as it arrived, retry_after_seconds 31 on it").toEqual(inFlightBody(1, 31));
        expect(error.rawResponse?.headers.get("Retry-After")).toBe("31");
    });
});

describe("no wait named: the backoff", () => {
    /**
     * The waits between the attempts of fillSchema when every attempt meets a 502, which names no wait, in
     * milliseconds, under one random draw and the client's retry setting.
     */
    async function waitsUnder(random: number, maxRetries = 4): Promise<number[]> {
        vi.spyOn(Math, "random").mockReturnValue(random);
        const allowed = maxRetries + 1;
        const script = new Script([
            LIMITS,
            ...Array.from({ length: allowed }, (_, index) => gatewayError(FILL_SCHEMA, index + 1)),
        ]);
        const ended = settle(FILL_SCHEMA.send(script.client({ maxRetries })));
        // Each wait is at most the longest the client takes, and one more such span shows any attempt past the count.
        await vi.advanceTimersByTimeAsync((allowed + 1) * LONGEST_WAIT_MS);
        expect(attemptsOf(script, FILL_SCHEMA), "the count the setting allows").toBe(allowed);
        expect(await ended).toEqual({ error: expect.any(BadGatewayError) });
        const sent = script.sentAt.slice(1);
        return sent.slice(1).map((at, index) => at - (sent[index] ?? Number.NaN));
    }

    it("doubles from 1 second: 1, 2, 4 and 8 seconds when the random draw sits at its middle", async () => {
        // When the answer names no wait, the wait starts at 1 second and doubles; the middle of the draw varies
        // nothing, so the waits show the doubling itself.
        expect(await waitsUnder(0.5)).toEqual([1000, 2000, 4000, 8000]);
    });

    it("varies the backoff with the random draw", async () => {
        // The jitter is random: under the lowest draw every wait is shorter than under the highest.
        const low = await waitsUnder(0);
        vi.restoreAllMocks();
        const high = await waitsUnder(0.999999);

        for (const index of [0, 1, 2, 3]) {
            expect(low[index], `wait ${index + 1} under the lowest draw is shorter`).toBeLessThan(high[index] ?? 0);
        }
    });

    it("never waits past 30 seconds, even under a caller's maxRetries above four", async () => {
        // Six retries would double the wait to 32 seconds; it stops at 30 whatever the draw.
        expect(await waitsUnder(0.5, 6), "at the middle draw").toEqual([1000, 2000, 4000, 8000, 16_000, 30_000]);
        vi.restoreAllMocks();
        const highest = await waitsUnder(0.999999, 6);
        expect(Math.max(...highest), "at the highest draw").toBe(30_000);
    });

    it("waits the backoff, not the body's figure, after an in-flight 409 whose body names a wait its Retry-After does not: an answer the contract never gives", async () => {
        // The contract repeats Retry-After in the body, never the body alone. On this answer the SDK reads the one
        // header a wait comes from, finds none, and takes the backoff: 1 second at the middle of the draw.
        vi.spyOn(Math, "random").mockReturnValue(0.5);
        const script = new Script([
            LIMITS,
            {
                method: "POST",
                path: FETCH_CONTENTS.path,
                status: 409,
                body: problem("idempotency-key-in-flight", { retry_after_seconds: 5 }),
            },
            ANSWERED,
        ]);

        const ended = settle(FETCH_CONTENTS.send(script.client()));
        await vi.advanceTimersByTimeAsync(999);
        expect(attemptsOf(script), "no attempt before the 1-second backoff").toBe(1);
        await vi.advanceTimersByTimeAsync(1);

        expect(attemptsOf(script), "the second attempt after the backoff, not after the body's 5 seconds").toBe(2);
        expect(await ended).toEqual({ value: FETCH_CONTENTS.answer });
    });
});

describe("the count of attempts", () => {
    it("makes five attempts against five in-flight 409s and raises the fifth", async () => {
        // At most five attempts; the fifth 409 comes back as it arrived.
        const script = new Script([
            LIMITS,
            inFlight(1, 1),
            inFlight(2, 1),
            inFlight(3, 1),
            inFlight(4, 1),
            inFlight(5, 1),
        ]);

        const ended = settle(FETCH_CONTENTS.send(script.client()));
        // Four waits of 1 second, and one more, in which a sixth attempt would show.
        await vi.advanceTimersByTimeAsync(5 * 1000);

        expect(attemptsOf(script), "five attempts, no sixth").toBe(5);
        const outcome = await ended;
        expect(outcome).toEqual({ error: expect.any(ConflictError) });
        expect((outcome as { error: ConflictError }).error.body, "the fifth answer").toEqual(inFlightBody(5, 1));
    });

    it("counts a 429 and the in-flight 409s after it as one count of five attempts", async () => {
        // The five attempts are one count per call across every retried answer, the 429 included.
        const script = new Script([
            LIMITS,
            { method: "POST", path: FETCH_CONTENTS.path, ...asksToWait("rate-limit-exceeded", 1) },
            inFlight(2, 1),
            inFlight(3, 1),
            inFlight(4, 1),
            inFlight(5, 1),
        ]);

        const ended = settle(FETCH_CONTENTS.send(script.client()));
        // Four waits of 1 second, and one more, in which a sixth attempt would show.
        await vi.advanceTimersByTimeAsync(5 * 1000);

        expect(attemptsOf(script), "five attempts in all").toBe(5);
        const outcome = await ended;
        expect(outcome).toEqual({ error: expect.any(ConflictError) });
        expect((outcome as { error: ConflictError }).error.body, "the fifth answer").toEqual(inFlightBody(5, 1));
    });

    it.each([
        ["one attempt", 0, 1],
        ["three attempts", 2, 3],
    ])("makes %s in all under the caller's maxRetries of %d", async (_words, maxRetries, count) => {
        // The caller's retry setting governs the one count, the in-flight 409 included.
        const steps = Array.from({ length: count }, (_, index) => inFlight(index + 1, 1));
        const script = new Script([LIMITS, ...steps]);

        const ended = settle(FETCH_CONTENTS.send(script.client({ maxRetries })));
        // One second for each wait the count allows, and one more, in which an attempt past the count would show.
        await vi.advanceTimersByTimeAsync((count + 1) * 1000);

        expect(attemptsOf(script)).toBe(count);
        const outcome = await ended;
        expect(outcome).toEqual({ error: expect.any(ConflictError) });
        expect((outcome as { error: ConflictError }).error.body, "the last answer").toEqual(inFlightBody(count, 1));
    });
});

describe("a 409 that is not in flight", () => {
    it("raises 409 record-without-content at once, after one request", async () => {
        // Only a key in flight is worth a retry; a record without content never is. The contract's operations on a
        // record answer it, highlightContents among them.
        const body = problem("record-without-content");
        const script = new Script([LIMITS, { method: "POST", path: HIGHLIGHT_CONTENTS.path, status: 409, body }]);

        const ended = settle(HIGHLIGHT_CONTENTS.send(script.client()));
        // Past the longest wait the client takes, in which a retry would show.
        await vi.advanceTimersByTimeAsync(LONGEST_WAIT_MS);

        expect(script.calls(), "one attempt, no retry").toEqual(["GET /v1/limits", `POST ${HIGHLIGHT_CONTENTS.path}`]);
        const outcome = await ended;
        expect(outcome).toEqual({ error: expect.any(ConflictError) });
        expect((outcome as { error: ConflictError }).error.body).toEqual(body);
    });

    it("raises at once a 409 whose body names no type: an answer the contract never gives", async () => {
        // Every problem the contract sends names its type. On this one the SDK has no type to retry by, so the 409
        // comes back at once, as it arrived, though it asks for a wait.
        const { type: _type, ...body } = problem("idempotency-key-in-flight", { retry_after_seconds: 1 });
        const script = new Script([
            LIMITS,
            { method: "POST", path: FETCH_CONTENTS.path, status: 409, body, headers: { "Retry-After": "1" } },
        ]);

        const ended = settle(FETCH_CONTENTS.send(script.client()));
        // Past the 1 second the 409 asks for, in which a retry would show.
        await vi.advanceTimersByTimeAsync(2000);

        expect(script.calls(), "one attempt, no retry").toEqual(["GET /v1/limits", `POST ${FETCH_CONTENTS.path}`]);
        const outcome = await ended;
        expect(outcome).toEqual({ error: expect.any(ConflictError) });
        expect((outcome as { error: ConflictError }).error.body).toEqual(body);
    });
});

describe("the caller's abort signal", () => {
    it("ends a wait between attempts at once with the SDK's own error, and sends nothing more", async () => {
        // A wait ends the moment the caller aborts, as an aborted request ends: the SDK's error for it, with no
        // attempt after it.
        const controller = new AbortController();
        const script = new Script([LIMITS, inFlight(1, 10), ANSWERED]);

        const ended = settle(FETCH_CONTENTS.send(script.client(), undefined, { abortSignal: controller.signal }));
        // The caller aborts 3 seconds into the 10-second wait the 409 asks for; the call ends with no more time passing.
        await vi.advanceTimersByTimeAsync(3000);
        controller.abort(new Error("the caller stopped waiting"));
        const outcome = await ended;

        expect(outcome).toEqual({ error: expect.any(GetCleanError) });
        expect(
            (outcome as { error: GetCleanError }).error.constructor,
            "the SDK's own error, no class of a status",
        ).toBe(GetCleanError);
        // Past the end of the wait the 409 asked for, in which a second attempt would show.
        await vi.advanceTimersByTimeAsync(10_000);
        expect(attemptsOf(script), "no attempt after the abort").toBe(1);
    });
});

describe("the retries of the generated runtime", () => {
    it.each([
        [429, "rate-limit-exceeded"],
        [503, "overloaded"],
    ] as const)("retries a %s with the same key after the wait it names, and returns the answer after it", async (status, type) => {
        // A 429 and a 503 name their wait; the client asks again after it, with the same key.
        const script = new Script([
            LIMITS,
            { method: "POST", path: FETCH_CONTENTS.path, ...asksToWait(type, 1) },
            ANSWERED,
        ]);

        const ended = settle(FETCH_CONTENTS.send(script.client()));
        await vi.advanceTimersByTimeAsync(999);
        expect(attemptsOf(script), `no retry of the ${status} before its 1 second`).toBe(1);
        await vi.advanceTimersByTimeAsync(1);

        expect(attemptsOf(script)).toBe(2);
        const keys = script.headers(FETCH_CONTENTS.path, "Idempotency-Key");
        expect(keys[0]).toMatch(UUID_V4);
        expect(keys[1], "the retry carries the first attempt's key").toBe(keys[0]);
        expect(await ended).toEqual({ value: FETCH_CONTENTS.answer });
    });

    it.each([
        [502, "gateway-error", FILL_SCHEMA],
        [504, "gateway-timeout", SUMMARIZE_CONTENTS],
    ] as const)("retries a %s of a model step with the same key after the backoff, and returns the answer after it", async (_status, type, call) => {
        // The model steps' 502 and 504 name no wait; the client asks again after the backoff, 1 second at the middle
        // of the draw, with the same key.
        vi.spyOn(Math, "random").mockReturnValue(0.5);
        const script = new Script([
            LIMITS,
            { method: "POST", path: call.path, status: statusOf(type), body: problem(type) },
            { method: "POST", path: call.path, status: call.status, body: call.answer },
        ]);

        const ended = settle(call.send(script.client()));
        await vi.advanceTimersByTimeAsync(999);
        expect(attemptsOf(script, call), "no retry before the 1-second backoff").toBe(1);
        await vi.advanceTimersByTimeAsync(1);

        expect(attemptsOf(script, call)).toBe(2);
        const keys = script.headers(call.path, "Idempotency-Key");
        expect(keys[0]).toMatch(UUID_V4);
        expect(keys[1], "the retry carries the first attempt's key").toBe(keys[0]);
        expect(await ended).toEqual({ value: call.answer });
    });

    it("raises a 504 of a model step as it arrived once the five attempts are spent", async () => {
        // The one count holds for the backoff too: after five 504s the last comes back as it arrived.
        vi.spyOn(Math, "random").mockReturnValue(0.5);
        const answers = Array.from(
            { length: 5 },
            (): Step => ({
                method: "POST",
                path: SUMMARIZE_CONTENTS.path,
                status: 504,
                body: problem("gateway-timeout"),
            }),
        );
        const script = new Script([LIMITS, ...answers]);

        const ended = settle(SUMMARIZE_CONTENTS.send(script.client()));
        // The four backoffs at the middle draw, 1, 2, 4 and 8 seconds, and the longest wait more, in which a sixth
        // attempt would show.
        await vi.advanceTimersByTimeAsync(15_000 + LONGEST_WAIT_MS);

        expect(attemptsOf(script, SUMMARIZE_CONTENTS), "five attempts, no sixth").toBe(5);
        const outcome = await ended;
        expect(outcome).toEqual({ error: expect.any(GatewayTimeoutError) });
        expect((outcome as { error: GatewayTimeoutError }).error.body).toEqual(problem("gateway-timeout"));
    });

    it("ends the retries of a 429 that asks for 31 seconds and raises it as it arrived", async () => {
        // A Retry-After past the ceiling ends the retries of a 429 as it does those of a 409.
        const answer = asksToWait("rate-limit-exceeded", 31);
        const script = new Script([LIMITS, { method: "POST", path: FETCH_CONTENTS.path, ...answer }]);

        const ended = settle(FETCH_CONTENTS.send(script.client()));
        await vi.advanceTimersByTimeAsync(31_000);

        expect(attemptsOf(script), "one attempt, no retry").toBe(1);
        const outcome = await ended;
        expect(outcome).toEqual({ error: expect.any(TooManyRequestsError) });
        expect((outcome as { error: TooManyRequestsError }).error.body).toEqual(answer.body);
    });

    it("waits the backoff, not X-RateLimit-Reset or retry-after-ms, after a 429 that names no Retry-After: an answer the contract never gives", async () => {
        // Every 429 of the contract carries Retry-After. On one without it, the SDK reads no other header for a wait:
        // it takes the backoff, 1 second at the middle of the draw, whatever the other headers ask.
        vi.setSystemTime(new Date("2026-11-04T10:00:00.000Z"));
        vi.spyOn(Math, "random").mockReturnValue(0.5);
        const tenSecondsOn = String(Date.parse("2026-11-04T10:00:10.000Z") / 1000);
        const script = new Script([
            LIMITS,
            {
                method: "POST",
                path: FETCH_CONTENTS.path,
                status: 429,
                body: problem("rate-limit-exceeded"),
                headers: { "X-RateLimit-Reset": tenSecondsOn, "retry-after-ms": "10000" },
            },
            ANSWERED,
        ]);

        const ended = settle(FETCH_CONTENTS.send(script.client()));
        await vi.advanceTimersByTimeAsync(999);
        expect(attemptsOf(script), "no retry before the 1-second backoff").toBe(1);
        await vi.advanceTimersByTimeAsync(1);

        expect(attemptsOf(script), "the retry after the 1-second backoff, not after 10 seconds").toBe(2);
        expect(await ended).toEqual({ value: FETCH_CONTENTS.answer });
    });
});
