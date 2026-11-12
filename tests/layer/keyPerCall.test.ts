/**
 * The key per logical call. Every call that may bill carries one Idempotency-Key, the caller's or a fresh version 4
 * UUID; every attempt of that call carries the same key, so a retry is a replay and never a second charge; and the
 * key stands on every error the call raises, so the caller's own repeat is a replay too. The calls that bill nothing
 * go out as the generated client sends them, with no read of the limits before them.
 */

import { ConflictError, UnprocessableEntityError } from "../../src/api/errors/index.js";
import { GetClean as GeneratedGetClean } from "../../src/Client.js";
import { GetCleanError, GetCleanTimeoutError } from "../../src/index.js";
import {
    CANCEL_JOB_CANCELED,
    COMPARE_CONTENTS_CHANGED,
    COMPARE_CONTENTS_CHANGED_REQUEST,
    FETCH_CONTENTS_INVALID_FIELD,
    GET_CONTENTS_DELIVERED,
    GET_DATASOURCE_ENTRY,
    GET_JOB_COMPLETED,
    GET_LIMITS_LIMITS,
    GET_SEARCH_DELIVERED,
    GET_SECTION_FITS,
    LIST_BLOCKS_FIRST_PAGE,
    LIST_CONTENTS_FIRST_PAGE,
    LIST_DATASOURCES_FIRST_PAGE,
    LIST_JOBS_FIRST_PAGE,
    LIST_LINKS_FIRST_PAGE,
} from "./examples.js";
import {
    asksToWait,
    BASE_URL,
    BILLED_CALLS,
    CALLERS_KEY,
    FETCH_CONTENTS,
    problem,
    RECORD_ID,
    Script,
    type Step,
    settle,
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

/** The answer of a key still in flight, asking for a wait of one second, the least the contract allows. */
const IN_FLIGHT = asksToWait("idempotency-key-in-flight", 1);

describe("a call that may bill", () => {
    it.each(BILLED_CALLS)("$method sends a version 4 UUID as its key when the caller gives none", async (call) => {
        // A call that may bill carries a key; given none, the client makes a version 4 UUID.
        const script = new Script([
            LIMITS,
            { method: "POST", path: call.path, status: call.status, body: call.answer },
        ]);

        const ended = await settle(call.send(script.client()));

        expect(script.calls()).toEqual(["GET /v1/limits", `POST ${call.path}`]);
        expect(script.headers(call.path, "Idempotency-Key")).toEqual([expect.stringMatching(UUID_V4)]);
        expect(ended).toEqual({ value: call.answer });
    });

    it.each(BILLED_CALLS)("$method makes a fresh key for each call when the caller gives none", async (call) => {
        // One key per call, not per client: the second call is a new call, never a replay of the first.
        const script = new Script([
            LIMITS,
            { method: "POST", path: call.path, status: call.status, body: call.answer },
            { method: "POST", path: call.path, status: call.status, body: call.answer },
        ]);
        const client = script.client();

        await call.send(client);
        await call.send(client);

        const keys = script.headers(call.path, "Idempotency-Key");
        expect(keys).toEqual([expect.stringMatching(UUID_V4), expect.stringMatching(UUID_V4)]);
        expect(keys[1], "the second call's key differs from the first's").not.toBe(keys[0]);
    });

    it.each(BILLED_CALLS)("$method sends the caller's key unchanged on every attempt", async (call) => {
        // The key a caller gives is the key of each attempt of the call, the retry of an in-flight 409 included.
        const script = new Script([
            LIMITS,
            { method: "POST", path: call.path, ...IN_FLIGHT },
            { method: "POST", path: call.path, status: call.status, body: call.answer },
        ]);

        const ended = settle(call.send(script.client(), CALLERS_KEY));
        await vi.advanceTimersByTimeAsync(1000);

        expect(script.calls()).toEqual(["GET /v1/limits", `POST ${call.path}`, `POST ${call.path}`]);
        expect(script.headers(call.path, "Idempotency-Key")).toEqual([CALLERS_KEY, CALLERS_KEY]);
        expect(await ended).toEqual({ value: call.answer });
    });

    it.each(BILLED_CALLS)("$method sends the same key again after an in-flight 409", async (call) => {
        // Every attempt of one call carries the same key, so the attempt after an in-flight 409 is a replay.
        const script = new Script([
            LIMITS,
            { method: "POST", path: call.path, ...IN_FLIGHT },
            { method: "POST", path: call.path, status: call.status, body: call.answer },
        ]);

        const ended = settle(call.send(script.client()));
        await vi.advanceTimersByTimeAsync(1000);

        expect(script.calls()).toEqual(["GET /v1/limits", `POST ${call.path}`, `POST ${call.path}`]);
        const keys = script.headers(call.path, "Idempotency-Key");
        expect(keys[0]).toMatch(UUID_V4);
        expect(keys[1], "the attempt after the 409 carries the first attempt's key").toBe(keys[0]);
        expect(await ended).toEqual({ value: call.answer });
    });

    it.each(
        BILLED_CALLS,
    )("$method keeps its key across the retry of a 429 and the in-flight retry after it", async (call) => {
        // The same key on every attempt, whichever answer caused the retry: a 429, then an in-flight 409.
        const script = new Script([
            LIMITS,
            { method: "POST", path: call.path, ...asksToWait("rate-limit-exceeded", 1) },
            { method: "POST", path: call.path, ...IN_FLIGHT },
            { method: "POST", path: call.path, status: call.status, body: call.answer },
        ]);

        const ended = settle(call.send(script.client()));
        await vi.advanceTimersByTimeAsync(1000);
        await vi.advanceTimersByTimeAsync(1000);

        expect(script.calls()).toEqual([
            "GET /v1/limits",
            `POST ${call.path}`,
            `POST ${call.path}`,
            `POST ${call.path}`,
        ]);
        const keys = script.headers(call.path, "Idempotency-Key");
        expect(keys[0]).toMatch(UUID_V4);
        expect(keys, "the three attempts carry one key").toEqual([keys[0], keys[0], keys[0]]);
        expect(await ended).toEqual({ value: call.answer });
    });
});

/** The key on an error, `idempotencyKey`, named as the SDK's errors name their other members, `statusCode` among them. */
function keyOn(ending: unknown): unknown {
    return (ending as { error?: GetCleanError }).error?.idempotencyKey;
}

describe("the key on the errors of a call that may bill", () => {
    it.each(BILLED_CALLS)("$method puts the key it sent on the error of a transport failure", async (call) => {
        // The key the call sent stands on every error it raises, so the caller's own repeat carries it and is a
        // replay, never a second charge.
        const script = new Script([
            LIMITS,
            { method: "POST", path: call.path, transportError: new TypeError("fetch failed") },
        ]);

        const ended = await settle(call.send(script.client()));

        const [sent] = script.headers(call.path, "Idempotency-Key");
        expect(sent).toMatch(UUID_V4);
        expect(ended).toEqual({ error: expect.any(GetCleanError) });
        expect(keyOn(ended), "the key the call sent").toBe(sent);
    });

    it("puts the key it sent on the error of an attempt cut by its timeout", async () => {
        // A timeout leaves the caller not knowing whether the call ran: the key on the error makes the repeat a
        // replay.
        const script = new Script([LIMITS, { method: "POST", path: FETCH_CONTENTS.path, never: true }]);

        const ended = settle(FETCH_CONTENTS.send(script.client()));
        // The contract's call_seconds for contents, 110, and the margin of 10.
        await vi.advanceTimersByTimeAsync(120_000);

        const [sent] = script.headers(FETCH_CONTENTS.path, "Idempotency-Key");
        const outcome = await ended;
        expect(outcome).toEqual({ error: expect.any(GetCleanTimeoutError) });
        expect(keyOn(outcome), "the key the call sent").toBe(sent);
    });

    it("puts the caller's key on the error of a refusal, the contract's 422 example", async () => {
        // The key on the error is the key the call carried, the caller's own when the caller gave one.
        const script = new Script([
            LIMITS,
            { method: "POST", path: FETCH_CONTENTS.path, status: 422, body: FETCH_CONTENTS_INVALID_FIELD },
        ]);

        const ended = await settle(FETCH_CONTENTS.send(script.client(), CALLERS_KEY));

        expect(ended).toEqual({ error: expect.any(UnprocessableEntityError) });
        expect((ended as { error: UnprocessableEntityError }).error.body).toEqual(FETCH_CONTENTS_INVALID_FIELD);
        expect(keyOn(ended), "the caller's key").toBe(CALLERS_KEY);
    });

    it("puts the key it sent on the in-flight 409 raised after five attempts", async () => {
        // The answer raised when the attempts run out carries the key, so the caller can ask again later.
        const script = new Script([
            LIMITS,
            ...Array.from({ length: 5 }, (): Step => ({ method: "POST", path: FETCH_CONTENTS.path, ...IN_FLIGHT })),
        ]);

        const ended = settle(FETCH_CONTENTS.send(script.client()));
        // Four waits of 1 second, and one more, in which a sixth attempt would show.
        await vi.advanceTimersByTimeAsync(5000);

        const keys = script.headers(FETCH_CONTENTS.path, "Idempotency-Key");
        expect(keys).toHaveLength(5);
        const outcome = await ended;
        expect(outcome).toEqual({ error: expect.any(ConflictError) });
        expect(keyOn(outcome), "the key of the five attempts").toBe(keys[0]);
    });
});

describe("search with no argument", () => {
    it("goes out as a call that may bill, and the contract's refusal of a search with no query comes back as the typed error", async () => {
        // search() with no argument is still a call that may bill: it reads the limits, carries a fresh key, and the
        // server's refusal comes back as the error class of its status, the problem on it and the key with it.
        // The contract refuses a search with neither query nor subject_identifiers as invalid-field, kind required;
        // its example of the type is the upload's, so the detail and the violation are written from that rule.
        const refusal = problem("invalid-field", {
            detail: "Send query or subject_identifiers.",
            violations: [
                {
                    kind: "required",
                    place: "body",
                    pointer: "/query",
                    field: "query",
                    message: "query or subject_identifiers is required.",
                },
            ],
        });
        const script = new Script([LIMITS, { method: "POST", path: "/v1/search", status: 422, body: refusal }]);

        const ended = await settle(script.client().search());

        expect(script.calls(), "the search went out, after the limits").toEqual(["GET /v1/limits", "POST /v1/search"]);
        const [sent] = script.headers("/v1/search", "Idempotency-Key");
        expect(sent).toMatch(UUID_V4);
        expect(ended).toEqual({ error: expect.any(UnprocessableEntityError) });
        expect((ended as { error: UnprocessableEntityError }).error.body).toEqual(refusal);
        expect(keyOn(ended), "the key the call sent").toBe(sent);
    });
});

/** A call that bills nothing, the request it sends and its answer; sent through the layer or the generated client. */
type FreeCall = {
    method: string;
    request: string;
    status: number;
    body?: unknown;
    send: (client: GeneratedGetClean) => Promise<unknown>;
};

/** The fourteen operations that bill nothing, each answered with the contract's example of it. */
const FREE_CALLS: FreeCall[] = [
    {
        method: "listContents",
        request: "GET /v1/contents",
        status: 200,
        body: LIST_CONTENTS_FIRST_PAGE,
        send: (client) => client.listContents({ url: "https://example.com/*" }),
    },
    {
        method: "getContents",
        request: `GET /v1/contents/${GET_CONTENTS_DELIVERED.id}`,
        status: 200,
        body: GET_CONTENTS_DELIVERED,
        send: (client) => client.getContents(GET_CONTENTS_DELIVERED.id),
    },
    {
        method: "deleteContents",
        request: `DELETE /v1/contents/${RECORD_ID}`,
        status: 204,
        send: (client) => client.deleteContents(RECORD_ID),
    },
    {
        method: "getSection",
        request: `GET /v1/contents/${GET_SECTION_FITS.contents_id}/sections/${GET_SECTION_FITS.section.id}`,
        status: 200,
        body: GET_SECTION_FITS,
        send: (client) => client.getSection(GET_SECTION_FITS.contents_id, GET_SECTION_FITS.section.id),
    },
    {
        method: "listBlocks",
        request: `GET /v1/contents/${LIST_BLOCKS_FIRST_PAGE.contents_id}/blocks`,
        status: 200,
        body: LIST_BLOCKS_FIRST_PAGE,
        send: (client) => client.listBlocks(LIST_BLOCKS_FIRST_PAGE.contents_id, { block_kinds: ["table"] }),
    },
    {
        method: "listLinks",
        request: `GET /v1/contents/${LIST_LINKS_FIRST_PAGE.contents_id}/links`,
        status: 200,
        body: LIST_LINKS_FIRST_PAGE,
        send: (client) => client.listLinks(LIST_LINKS_FIRST_PAGE.contents_id, { link_kinds: ["file"] }),
    },
    {
        method: "compareContents",
        request: `POST /v1/contents/${COMPARE_CONTENTS_CHANGED.contents_id}:compare`,
        status: 200,
        body: COMPARE_CONTENTS_CHANGED,
        send: (client) =>
            client.compareContents(COMPARE_CONTENTS_CHANGED.contents_id, COMPARE_CONTENTS_CHANGED_REQUEST),
    },
    {
        method: "listJobs",
        request: "GET /v1/jobs",
        status: 200,
        body: LIST_JOBS_FIRST_PAGE,
        send: (client) => client.listJobs({ state: "completed" }),
    },
    {
        method: "getJob",
        request: `GET /v1/jobs/${GET_JOB_COMPLETED.id}`,
        status: 200,
        body: GET_JOB_COMPLETED,
        send: (client) => client.getJob(GET_JOB_COMPLETED.id),
    },
    {
        method: "cancelJob",
        request: `POST /v1/jobs/${CANCEL_JOB_CANCELED.id}:cancel`,
        status: 200,
        body: CANCEL_JOB_CANCELED,
        send: (client) => client.cancelJob(CANCEL_JOB_CANCELED.id),
    },
    {
        method: "getLimits",
        request: "GET /v1/limits",
        status: 200,
        body: GET_LIMITS_LIMITS,
        send: (client) => client.getLimits(),
    },
    {
        method: "getSearch",
        request: `GET /v1/search/${GET_SEARCH_DELIVERED.id}`,
        status: 200,
        body: GET_SEARCH_DELIVERED,
        send: (client) => client.getSearch(GET_SEARCH_DELIVERED.id),
    },
    {
        method: "listDatasources",
        request: "GET /v1/datasources",
        status: 200,
        body: LIST_DATASOURCES_FIRST_PAGE,
        send: (client) => client.listDatasources({ group: "web" }),
    },
    {
        method: "getDatasource",
        request: `GET /v1/datasources/${GET_DATASOURCE_ENTRY.id}`,
        status: 200,
        body: GET_DATASOURCE_ENTRY,
        send: (client) => client.getDatasource(GET_DATASOURCE_ENTRY.id),
    },
];

/** A request's headers by name; an Idempotency-Key is kept as present, not by value, since each client makes its own. */
function headersOf(request: Request | undefined): Record<string, string> {
    const headers: Record<string, string> = {};
    request?.headers.forEach((value, name) => {
        headers[name] = name === "idempotency-key" ? "present" : value;
    });
    return headers;
}

describe("a call that bills nothing", () => {
    it.each(
        FREE_CALLS,
    )("$method goes out as the generated client sends it, with no read of the limits and nothing added", async (call) => {
        // A free call is the generated client's alone: one request, no limits read before it, and the very request
        // the generated client sends for the same call, header by header, whatever key it makes of its own.
        const [method, path] = call.request.split(" ") as ["GET" | "POST" | "DELETE", string];
        const answer: Step = { method, path, status: call.status, body: call.body };
        const throughTheLayer = new Script([answer]);
        const throughTheGeneratedClient = new Script([answer]);

        await call.send(throughTheLayer.client());
        await call.send(
            new GeneratedGetClean({ apiKey: "a-test-key", baseUrl: BASE_URL, fetch: throughTheGeneratedClient.fetch }),
        );

        expect(throughTheLayer.calls(), "one request, no read of the limits").toEqual([call.request]);
        const [layered, generated] = [throughTheLayer.requests[0], throughTheGeneratedClient.requests[0]];
        expect(layered?.url, "the generated client's URL").toBe(generated?.url);
        expect(await layered?.text(), "the generated client's body").toBe(await generated?.text());
        expect(headersOf(layered), "the generated client's headers, no more and no fewer").toEqual(
            headersOf(generated),
        );
    });
});
