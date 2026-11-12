const INITIAL_RETRY_DELAY = 1000; // in milliseconds
const MAX_RETRY_DELAY = 30000; // in milliseconds
const DEFAULT_MAX_RETRIES = 4;
const JITTER_FACTOR = 0.2; // 20% random jitter
/**
 * The problem types retried beside the statuses, each the last segment of an RFC 9457 problem type: a refusal that names
 * a wait rather than a fault, such as a request still running under the same idempotency key. One count of attempts
 * covers the statuses and the types.
 */
const RETRY_PROBLEM_TYPES: readonly string[] = ["idempotency-key-in-flight"];

function isRetryableStatusCode(statusCode: number): boolean {
    return [429, 502, 503, 504].includes(statusCode);
}

/** The last segment of the problem type of a problem answer, or undefined when the answer is no problem with a type. */
async function getProblemTypeName(response: Response): Promise<string | undefined> {
    if (!(response.headers.get("Content-Type") ?? "").includes("json")) {
        return undefined;
    }
    try {
        const body: unknown = await response.clone().json();
        if (typeof body !== "object" || body === null || !("type" in body)) {
            return undefined;
        }
        const problemType = (body as { type?: unknown }).type;
        if (typeof problemType !== "string" || problemType.length === 0) {
            return undefined;
        }
        return problemType.replace(/\/+$/, "").split("/").pop();
    } catch {
        return undefined;
    }
}

/** Whether the answer is retried: by its status, or by its problem type. */
async function isRetryableResponse(response: Response): Promise<boolean> {
    if (isRetryableStatusCode(response.status)) {
        return true;
    }
    if (RETRY_PROBLEM_TYPES.length === 0 || response.status < 400) {
        return false;
    }
    const name = await getProblemTypeName(response);
    return name != null && RETRY_PROBLEM_TYPES.includes(name);
}

function addSymmetricJitter(delay: number): number {
    const jitterMultiplier = 1 + (Math.random() - 0.5) * JITTER_FACTOR;
    return delay * jitterMultiplier;
}

/**
 * The wait a response asks for in its Retry-After header (RFC 9110: seconds or an HTTP date), in milliseconds, exactly
 * as the server gives it; undefined when it asks for none. Retry-After is the one header read: it is the standard's,
 * and the one an API declares.
 */
function getRetryDelayFromHeaders(response: Response): number | undefined {
    const retryAfter = response.headers.get("Retry-After");
    if (retryAfter) {
        const retryAfterSeconds = parseInt(retryAfter, 10);
        if (!Number.isNaN(retryAfterSeconds) && retryAfterSeconds > 0) {
            return retryAfterSeconds * 1000;
        }

        const retryAfterDate = new Date(retryAfter);
        if (!Number.isNaN(retryAfterDate.getTime())) {
            const delay = retryAfterDate.getTime() - Date.now();
            if (delay > 0) {
                return delay;
            }
        }
    }

    return undefined;
}

/**
 * The doubling backoff before retry `retryAttempt`, with jitter, capped at MAX_RETRY_DELAY after the jitter is drawn.
 */
function getBackoffDelay(retryAttempt: number): number {
    return Math.min(addSymmetricJitter(INITIAL_RETRY_DELAY * 2 ** retryAttempt), MAX_RETRY_DELAY);
}

/**
 * Waits `ms` milliseconds, or rejects as soon as `abortSignal` aborts. The timer and
 * the abort listener are always removed, so a cancelled wait never keeps the process alive.
 */
function sleep(ms: number, abortSignal: AbortSignal | undefined): Promise<void> {
    return new Promise((resolve, reject) => {
        if (abortSignal?.aborted) {
            reject(abortSignal.reason);
            return;
        }
        const onAbort = () => {
            clearTimeout(timeoutId);
            reject(abortSignal?.reason);
        };
        const timeoutId = setTimeout(() => {
            abortSignal?.removeEventListener("abort", onAbort);
            resolve();
        }, ms);
        abortSignal?.addEventListener("abort", onAbort, { once: true });
    });
}

export async function requestWithRetries(
    requestFn: () => Promise<Response>,
    maxRetries: number = DEFAULT_MAX_RETRIES,
    abortSignal?: AbortSignal,
): Promise<Response> {
    let response: Response = await requestFn();

    for (let i = 0; i < maxRetries; ++i) {
        if (await isRetryableResponse(response)) {
            const headerDelay = getRetryDelayFromHeaders(response);
            if (headerDelay != null && headerDelay > MAX_RETRY_DELAY) {
                // The server asks for a longer wait than this client takes by itself: the retries end here, and the
                // response is returned as it arrived.
                break;
            }
            const delay = headerDelay ?? getBackoffDelay(i);

            await sleep(delay, abortSignal);
            response = await requestFn();
        } else {
            break;
        }
    }
    return response!;
}
