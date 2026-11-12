import type { Mock, MockInstance } from "vitest";
import { requestWithRetries } from "../../../src/core/fetcher/requestWithRetries";

describe("requestWithRetries", () => {
    let mockFetch: Mock;
    let originalMathRandom: typeof Math.random;
    let setTimeoutSpy: MockInstance;

    beforeEach(() => {
        mockFetch = vi.fn();
        originalMathRandom = Math.random;

        Math.random = vi.fn(() => 0.5);

        vi.useFakeTimers({
            toFake: [
                "setTimeout",
                "clearTimeout",
                "setInterval",
                "clearInterval",
                "setImmediate",
                "clearImmediate",
                "Date",
                "performance",
                "requestAnimationFrame",
                "cancelAnimationFrame",
                "requestIdleCallback",
                "cancelIdleCallback",
            ],
        });
    });

    afterEach(() => {
        Math.random = originalMathRandom;
        vi.clearAllMocks();
        vi.clearAllTimers();
    });

    it("retries an answer whose problem type is configured, under the one count, after the server's wait", async () => {
        const problem = (type: string, headers: Record<string, string> = {}) =>
            new Response(
                JSON.stringify({ type: `https://api.example/problems/${type}`, title: "t", detail: "d", status: 409 }),
                {
                    status: 409,
                    headers: { "Content-Type": "application/problem+json", ...headers },
                },
            );
        mockFetch
            .mockResolvedValueOnce(problem("idempotency-key-in-flight", { "Retry-After": "2" }))
            .mockResolvedValueOnce(new Response("", { status: 201 }));

        const responsePromise = requestWithRetries(() => mockFetch(), 4);
        await vi.advanceTimersByTimeAsync(1999);
        expect(mockFetch).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(1);
        const response = await responsePromise;
        expect(mockFetch).toHaveBeenCalledTimes(2);
        expect(response.status).toBe(201);
    });

    it("returns an answer whose problem type is not configured as it arrived, with one request", async () => {
        mockFetch.mockResolvedValueOnce(
            new Response(
                JSON.stringify({
                    type: "https://api.example/problems/a-type-no-configuration-names",
                    title: "t",
                    detail: "d",
                    status: 409,
                }),
                {
                    status: 409,
                    headers: { "Content-Type": "application/problem+json" },
                },
            ),
        );
        const response = await requestWithRetries(() => mockFetch(), 4);
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(response.status).toBe(409);
        expect((await response.json()).type).toContain("a-type-no-configuration-names");
    });

    it("counts a retried problem type and a retried status in the one count", async () => {
        const inFlight = () =>
            new Response(
                JSON.stringify({
                    type: "https://api.example/problems/idempotency-key-in-flight",
                    title: "t",
                    detail: "d",
                    status: 409,
                }),
                {
                    status: 409,
                    headers: { "Content-Type": "application/problem+json" },
                },
            );
        mockFetch
            .mockResolvedValueOnce(inFlight())
            .mockResolvedValueOnce(new Response("", { status: 429 }))
            .mockResolvedValueOnce(inFlight())
            .mockResolvedValueOnce(new Response("", { status: 201 }));
        const responsePromise = requestWithRetries(() => mockFetch(), 2);
        await vi.runAllTimersAsync();
        const response = await responsePromise;
        // two retries allowed: the third answer is returned as it arrived
        expect(mockFetch).toHaveBeenCalledTimes(3);
        expect(response.status).toBe(409);
    });

    it("should retry on each configured retryable status code", async () => {
        setTimeoutSpy = vi.spyOn(global, "setTimeout").mockImplementation((callback: (args: void) => void) => {
            process.nextTick(callback);
            return null as any;
        });

        const retryableStatuses = [429, 502, 503, 504];
        let callCount = 0;

        mockFetch.mockImplementation(async () => {
            if (callCount < retryableStatuses.length) {
                return new Response("", { status: retryableStatuses[callCount++] });
            }
            return new Response("", { status: 200 });
        });

        const responsePromise = requestWithRetries(() => mockFetch(), retryableStatuses.length);
        await vi.runAllTimersAsync();
        const response = await responsePromise;

        expect(mockFetch).toHaveBeenCalledTimes(retryableStatuses.length + 1);
        expect(response.status).toBe(200);
    });

    it("should retry exactly the configured status codes among 400 to 599", async () => {
        setTimeoutSpy = vi.spyOn(global, "setTimeout").mockImplementation((callback: (args: void) => void) => {
            process.nextTick(callback);
            return null as any;
        });

        const retried: number[] = [];
        for (let status = 400; status <= 599; status++) {
            mockFetch.mockReset();
            mockFetch
                .mockResolvedValueOnce(new Response("", { status }))
                .mockResolvedValueOnce(new Response("", { status: 200 }));

            const responsePromise = requestWithRetries(() => mockFetch(), 1);
            await vi.runAllTimersAsync();
            await responsePromise;

            if (mockFetch.mock.calls.length > 1) {
                retried.push(status);
            }
        }

        expect(retried).toEqual([429, 502, 503, 504]);
    });

    it("should not retry on 500 Internal Server Error when it is not configured as retryable", async () => {
        setTimeoutSpy = vi.spyOn(global, "setTimeout").mockImplementation((callback: (args: void) => void) => {
            process.nextTick(callback);
            return null as any;
        });

        mockFetch
            .mockResolvedValueOnce(new Response("", { status: 500 }))
            .mockResolvedValueOnce(new Response("", { status: 200 }));

        const responsePromise = requestWithRetries(() => mockFetch(), 3);
        await vi.runAllTimersAsync();
        const response = await responsePromise;

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(response.status).toBe(500);
    });

    it("should respect maxRetries limit", async () => {
        setTimeoutSpy = vi.spyOn(global, "setTimeout").mockImplementation((callback: (args: void) => void) => {
            process.nextTick(callback);
            return null as any;
        });

        const maxRetries = 2;
        mockFetch.mockResolvedValue(new Response("", { status: 429 }));

        const responsePromise = requestWithRetries(() => mockFetch(), maxRetries);
        await vi.runAllTimersAsync();
        const response = await responsePromise;

        expect(mockFetch).toHaveBeenCalledTimes(maxRetries + 1);
        expect(response.status).toBe(429);
    });

    it("should apply the default retry count (4) when maxRetries is not given", async () => {
        setTimeoutSpy = vi.spyOn(global, "setTimeout").mockImplementation((callback: (args: void) => void) => {
            process.nextTick(callback);
            return null as any;
        });

        mockFetch.mockResolvedValue(new Response("", { status: 429 }));

        const responsePromise = requestWithRetries(() => mockFetch());
        await vi.runAllTimersAsync();
        const response = await responsePromise;

        expect(mockFetch).toHaveBeenCalledTimes(5);
        expect(response.status).toBe(429);
    });

    it("should not retry on status 599, a server error that is not configured as retryable", async () => {
        setTimeoutSpy = vi.spyOn(global, "setTimeout").mockImplementation((callback: (args: void) => void) => {
            process.nextTick(callback);
            return null as any;
        });

        mockFetch
            .mockResolvedValueOnce(new Response("", { status: 599 }))
            .mockResolvedValueOnce(new Response("", { status: 200 }));

        const responsePromise = requestWithRetries(() => mockFetch(), 3);
        await vi.runAllTimersAsync();
        const response = await responsePromise;

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(response.status).toBe(599);
    });

    it("should not retry on non-retryable client error (400)", async () => {
        setTimeoutSpy = vi.spyOn(global, "setTimeout").mockImplementation((callback: (args: void) => void) => {
            process.nextTick(callback);
            return null as any;
        });

        mockFetch.mockResolvedValueOnce(new Response("", { status: 400 }));

        const responsePromise = requestWithRetries(() => mockFetch(), 3);
        await vi.runAllTimersAsync();
        const response = await responsePromise;

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(response.status).toBe(400);
    });

    it("should not retry on success status codes", async () => {
        setTimeoutSpy = vi.spyOn(global, "setTimeout").mockImplementation((callback: (args: void) => void) => {
            process.nextTick(callback);
            return null as any;
        });

        const successStatuses = [200, 201, 202];

        for (const status of successStatuses) {
            mockFetch.mockReset();
            setTimeoutSpy.mockClear();
            mockFetch.mockResolvedValueOnce(new Response("", { status }));

            const responsePromise = requestWithRetries(() => mockFetch(), 3);
            await vi.runAllTimersAsync();
            await responsePromise;

            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(setTimeoutSpy).not.toHaveBeenCalled();
        }
    });

    interface RetryHeaderTestCase {
        description: string;
        headerName: string;
        headerValue: () => string;
        expectedDelay: (headerValue: string) => number;
    }

    // A wait the server asks for within MAX_RETRY_DELAY (30000ms) is taken exactly as asked: never shortened and
    // never jittered.
    const retryHeaderTests: RetryHeaderTestCase[] = [
        {
            description: "should wait the seconds a retry-after header gives",
            headerName: "retry-after",
            headerValue: () => "5",
            expectedDelay: (headerValue) => Number(headerValue) * 1000,
        },
        {
            description: "should wait until the HTTP date a retry-after header gives",
            headerName: "retry-after",
            headerValue: () => new Date(Date.now() + 3000).toUTCString(),
            expectedDelay: (headerValue) => new Date(headerValue).getTime() - Date.now(),
        },
    ];

    retryHeaderTests.forEach(({ description, headerName, headerValue, expectedDelay }) => {
        it(description, async () => {
            setTimeoutSpy = vi.spyOn(global, "setTimeout").mockImplementation((callback: (args: void) => void) => {
                process.nextTick(callback);
                return null as any;
            });

            const value = headerValue();
            const delay = expectedDelay(value);
            mockFetch
                .mockResolvedValueOnce(
                    new Response("", {
                        status: 429,
                        headers: new Headers({ [headerName]: value }),
                    }),
                )
                .mockResolvedValueOnce(new Response("", { status: 200 }));

            const responsePromise = requestWithRetries(() => mockFetch(), 1);
            await vi.runAllTimersAsync();
            const response = await responsePromise;

            expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
            expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), delay);
            expect(response.status).toBe(200);
        });
    });

    // A wait the server asks for beyond MAX_RETRY_DELAY (30000ms) ends the retries: the response is returned as it
    // arrived.
    const beyondTheCapTests: { description: string; headerName: string; headerValue: () => string }[] = [
        {
            description: "a retry-after header in seconds",
            headerName: "retry-after",
            headerValue: () => "60",
        },
        {
            description: "a retry-after header with an HTTP date",
            headerName: "retry-after",
            headerValue: () => new Date(Date.now() + 60000).toUTCString(),
        },
    ];

    beyondTheCapTests.forEach(({ description, headerName, headerValue }) => {
        it(`should return the response as it arrived when ${description} asks for longer than MAX_RETRY_DELAY`, async () => {
            setTimeoutSpy = vi.spyOn(global, "setTimeout").mockImplementation((callback: (args: void) => void) => {
                process.nextTick(callback);
                return null as any;
            });

            mockFetch
                .mockResolvedValueOnce(
                    new Response("rate limited", {
                        status: 429,
                        headers: new Headers({ [headerName]: headerValue() }),
                    }),
                )
                .mockResolvedValueOnce(new Response("", { status: 200 }));

            const responsePromise = requestWithRetries(() => mockFetch(), 3);
            await vi.runAllTimersAsync();
            const response = await responsePromise;

            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(setTimeoutSpy).not.toHaveBeenCalled();
            expect(response.status).toBe(429);
            expect(await response.text()).toBe("rate limited");
        });
    });

    // Retry-After is the one header a wait is read from: a non-standard header asking for a wait is not a server's
    // wait, so the backoff applies as if no header had come.
    it.each([
        ["x-ratelimit-reset", () => Math.floor((Date.now() + 4000) / 1000).toString()],
        ["retry-after-ms", () => "4000"],
    ])("should wait the backoff, not the wait a %s header asks for", async (headerName, headerValue) => {
        setTimeoutSpy = vi.spyOn(global, "setTimeout").mockImplementation((callback: (args: void) => void) => {
            process.nextTick(callback);
            return null as any;
        });

        mockFetch
            .mockResolvedValueOnce(
                new Response("", {
                    status: 429,
                    headers: new Headers({ [headerName]: headerValue() }),
                }),
            )
            .mockResolvedValueOnce(new Response("", { status: 200 }));

        const responsePromise = requestWithRetries(() => mockFetch(), 1);
        await vi.runAllTimersAsync();
        const response = await responsePromise;

        expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
        expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1000);
        expect(response.status).toBe(200);
    });

    it("should apply correct exponential backoff with jitter", async () => {
        setTimeoutSpy = vi.spyOn(global, "setTimeout").mockImplementation((callback: (args: void) => void) => {
            process.nextTick(callback);
            return null as any;
        });

        mockFetch.mockResolvedValue(new Response("", { status: 429 }));
        const maxRetries = 3;
        const expectedDelays = [1000, 2000, 4000];

        const responsePromise = requestWithRetries(() => mockFetch(), maxRetries);
        await vi.runAllTimersAsync();
        await responsePromise;

        expect(setTimeoutSpy).toHaveBeenCalledTimes(expectedDelays.length);

        expectedDelays.forEach((delay, index) => {
            expect(setTimeoutSpy).toHaveBeenNthCalledWith(index + 1, expect.any(Function), delay);
        });

        expect(mockFetch).toHaveBeenCalledTimes(maxRetries + 1);
    });

    it("should handle concurrent retries independently", async () => {
        setTimeoutSpy = vi.spyOn(global, "setTimeout").mockImplementation((callback: (args: void) => void) => {
            process.nextTick(callback);
            return null as any;
        });

        mockFetch
            .mockResolvedValueOnce(new Response("", { status: 429 }))
            .mockResolvedValueOnce(new Response("", { status: 429 }))
            .mockResolvedValueOnce(new Response("", { status: 200 }))
            .mockResolvedValueOnce(new Response("", { status: 200 }));

        const promise1 = requestWithRetries(() => mockFetch(), 1);
        const promise2 = requestWithRetries(() => mockFetch(), 1);

        await vi.runAllTimersAsync();
        const [response1, response2] = await Promise.all([promise1, promise2]);

        expect(response1.status).toBe(200);
        expect(response2.status).toBe(200);
    });

    it("should never wait longer than MAX_RETRY_DELAY, whatever the attempt and the jitter", async () => {
        setTimeoutSpy = vi.spyOn(global, "setTimeout").mockImplementation((callback: (args: void) => void) => {
            process.nextTick(callback);
            return null as any;
        });
        // The largest jitter a wait can draw.
        Math.random = vi.fn(() => 0.999999);

        mockFetch.mockResolvedValue(new Response("", { status: 429 }));
        // Enough retries for the doubling backoff to reach MAX_RETRY_DELAY (30000ms).
        const maxRetries = 6;

        const responsePromise = requestWithRetries(() => mockFetch(), maxRetries);
        await vi.runAllTimersAsync();
        await responsePromise;

        const delays: number[] = setTimeoutSpy.mock.calls.map((call) => call[1]);
        expect(delays).toHaveLength(maxRetries);
        expect(Math.max(...delays)).toBe(30000);
    });

    it("should stop waiting and not retry when aborted during the backoff", async () => {
        vi.restoreAllMocks();
        const controller = new AbortController();
        mockFetch.mockImplementation(async () => new Response("", { status: 429, headers: { "Retry-After": "1" } }));

        const responsePromise = requestWithRetries(() => mockFetch(), 2, controller.signal);
        const assertion = expect(responsePromise).rejects.toBe("cancelled");
        await vi.advanceTimersByTimeAsync(30);
        controller.abort("cancelled");
        await assertion;

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(vi.getTimerCount()).toBe(0);
    });

    it("should not wait when the signal is already aborted", async () => {
        vi.restoreAllMocks();
        const controller = new AbortController();
        controller.abort("cancelled");
        mockFetch.mockImplementation(async () => new Response("", { status: 429 }));

        await expect(requestWithRetries(() => mockFetch(), 2, controller.signal)).rejects.toBe("cancelled");
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(vi.getTimerCount()).toBe(0);
    });

    it("should still retry normally when a signal is passed but never aborted", async () => {
        vi.restoreAllMocks();
        const controller = new AbortController();
        mockFetch
            .mockImplementationOnce(async () => new Response("", { status: 429 }))
            .mockImplementationOnce(async () => new Response("", { status: 200 }));

        const responsePromise = requestWithRetries(() => mockFetch(), 2, controller.signal);
        await vi.runAllTimersAsync();
        const response = await responsePromise;

        expect(response.status).toBe(200);
        expect(mockFetch).toHaveBeenCalledTimes(2);
    });
});
