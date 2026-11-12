/**
 * The getclean client: the generated client (src/Client.ts) with the hand-written code on top.
 *
 * What it adds, in this file and in layer.ts: on every call that may bill, the limits read first, one idempotency
 * key for the call, which stands on any error it raises, and the timeout per attempt from the operation's own bound;
 * a document stream read into memory once before the first attempt; the upload's `wait` helper, which follows the
 * upload's job to the record; iterSection, the section pager; listJobs and listContents dropping repeats by id while
 * they page. The generated client already reads the host from GETCLEAN_BASE_URL, takes the credential as a value or a
 * function, takes a document as a path, bytes or a stream, retries what the contract says is retried, and sends the
 * User-Agent, so this client adds nothing there.
 */

import type * as api from "../api/index.js";
import { GetClean as GeneratedGetClean } from "../Client.js";
import { generateIdempotencyKey } from "../core/idempotency.js";
import * as core from "../core/index.js";
import { JobCanceled as JobCanceledClass } from "./JobCanceled.js";
import {
    assertPathExists,
    type Bound,
    carried,
    documentReadOnce,
    errorForProblem,
    type Family,
    helperWait,
    refusedForGood,
    sentList,
    sleep,
    TIMEOUT_MARGIN_SECONDS,
    Timeouts,
    withIdempotencyKey,
    withJob,
    withoutRepeats,
} from "./layer.js";

/** The wait helper asks getJob to wait up to a minute at a time. */
export const JOB_POLL_WAIT_SECONDS = 60;

const CANCELED_STATE = "canceled";

/** A request that may carry an idempotency key. */
type Keyed = { "Idempotency-Key"?: string | undefined };

/**
 * The getclean client.
 *
 * getclean is the data layer for research agents: web pages and documents as clean, exact text with the facts of their
 * source, and a search across the web and specialist sources with a receipt of what ran, every record saying what
 * happened and every billed answer what it cost.
 *
 * The credential is `apiKey`: an API key or an access token, as a value or as a function that returns one (`auth`
 * takes a provider as well); when none is given, the environment variable GETCLEAN_API_KEY. A client built with neither
 * throws GetCleanError before any request leaves. The host is https://api.getclean.ai, or `baseUrl`, or the environment
 * variable GETCLEAN_BASE_URL.
 *
 * A fetch or a search that did not deliver is an answer, not an error: its `outcome` says what happened. An HTTP
 * refusal is a typed error, one class per status (`GetClean.NotFoundError` and the others), each carrying the problem as
 * `body`; a job canceled before a record was made throws `JobCanceled`. A call that may bill carries one idempotency key
 * for all its attempts, which stands on any error it throws as `idempotencyKey`; the client retries 429, 502, 503, 504
 * and a 409 whose problem type is idempotency-key-in-flight, five attempts in all with the same key, `maxRetries`
 * changing the count. The timeout per attempt is the operation's own bound from the limits plus ten seconds for a
 * call that may bill, 120 seconds for a free call and until the limits are read; a `timeoutInSeconds` you set on the
 * call or on the client stands.
 *
 * @example
 *     const client = new GetClean();
 *     const contents = await client.fetchContents({ url: "https://example.com/article" });
 *     if (contents.outcome.kind === "delivered") {
 *         console.log(contents.markdown);
 *     }
 */
export class GetClean extends GeneratedGetClean {
    private readonly layerTimeouts: Timeouts = new Timeouts();

    /**
     * Reads the limits before the first call that may bill, carrying that call's headers and abort signal. A reading that fails
     * never fails the call: it leaves the defaults and is tried again before the next call that may bill, except after
     * a 401 or a 403, which would meet the same refusal for the client's life.
     */
    private async readLimits(requestOptions: GeneratedGetClean.RequestOptions | undefined): Promise<void> {
        if (this.layerTimeouts.read || this.layerTimeouts.refused) {
            return;
        }
        try {
            this.layerTimeouts.take(await super.getLimits(carried(requestOptions)));
        } catch (error) {
            if (refusedForGood(error)) {
                this.layerTimeouts.refuse();
            }
        }
    }

    /**
     * A call that may bill: the limits read first, one key for every attempt (the same form the generated client makes
     * for a call given none), left on any error the call throws; the timeout per attempt from the bound that times the
     * operation, set only where neither the call nor the client's construction set one.
     */
    private billed<Request extends Keyed, Response>(
        family: Family,
        bound: Bound,
        call: (
            request: Request,
            requestOptions: GeneratedGetClean.RequestOptions | undefined,
        ) => core.HttpResponsePromise<Response>,
        request: Request,
        requestOptions: GeneratedGetClean.RequestOptions | undefined,
    ): core.HttpResponsePromise<Response> {
        const attempt = async (): Promise<core.WithRawResponse<Response>> => {
            await this.readLimits(requestOptions);
            const key = request["Idempotency-Key"] ?? generateIdempotencyKey();
            const keyed: Request = { ...request, "Idempotency-Key": key };
            const options =
                requestOptions?.timeoutInSeconds == null && this._options.timeoutInSeconds == null
                    ? { ...requestOptions, timeoutInSeconds: this.layerTimeouts.seconds(family, bound) }
                    : requestOptions;
            try {
                return await call(keyed, options).withRawResponse();
            } catch (error) {
                withIdempotencyKey(error, key);
                throw error;
            }
        };
        return core.HttpResponsePromise.fromPromise(attempt());
    }

    public override fetchContents(
        request: GeneratedGetClean.FetchContentsRequest,
        requestOptions?: GeneratedGetClean.RequestOptions,
    ): core.HttpResponsePromise<api.Contents> {
        return this.billed("contents", "call_seconds", (r, o) => super.fetchContents(r, o), request, requestOptions);
    }

    public override fetchContentsBatch(
        request: GeneratedGetClean.FetchContentsBatchRequest,
        requestOptions?: GeneratedGetClean.RequestOptions,
    ): core.HttpResponsePromise<api.ContentsBatch> {
        return this.billed(
            "contents",
            "batch_seconds",
            (r, o) => super.fetchContentsBatch(r, o),
            request,
            requestOptions,
        );
    }

    public override highlightContents(
        contentsId: string,
        request: GeneratedGetClean.HighlightContentsRequest,
        requestOptions?: GeneratedGetClean.RequestOptions,
    ): core.HttpResponsePromise<api.ContentsHighlights> {
        return this.billed(
            "contents",
            "call_seconds",
            (r, o) => super.highlightContents(contentsId, r, o),
            request,
            requestOptions,
        );
    }

    public override fillSchema(
        contentsId: string,
        request: GeneratedGetClean.FillSchemaRequest,
        requestOptions?: GeneratedGetClean.RequestOptions,
    ): core.HttpResponsePromise<api.SchemaFill> {
        return this.billed(
            "contents",
            "call_seconds",
            (r, o) => super.fillSchema(contentsId, r, o),
            request,
            requestOptions,
        );
    }

    public override summarizeContents(
        contentsId: string,
        request: GeneratedGetClean.SummarizeContentsRequest = {},
        requestOptions?: GeneratedGetClean.RequestOptions,
    ): core.HttpResponsePromise<api.ContentsSummary> {
        return this.billed(
            "contents",
            "call_seconds",
            (r, o) => super.summarizeContents(contentsId, r, o),
            request,
            requestOptions,
        );
    }

    public override search(
        request: GeneratedGetClean.SearchRequest = {},
        requestOptions?: GeneratedGetClean.RequestOptions,
    ): core.HttpResponsePromise<api.Search> {
        return this.billed("search", "call_seconds", (r, o) => super.search(r, o), request, requestOptions);
    }

    public override searchBatch(
        request: GeneratedGetClean.SearchBatchRequest,
        requestOptions?: GeneratedGetClean.RequestOptions,
    ): core.HttpResponsePromise<api.SearchBatch> {
        return this.billed("search", "batch_seconds", (r, o) => super.searchBatch(r, o), request, requestOptions);
    }

    public override uploadContents(
        request: GetClean.UploadContentsRequest,
        requestOptions?: GeneratedGetClean.RequestOptions,
    ): core.HttpResponsePromise<api.ContentsUpload> {
        const { wait, ...upload } = request;
        const send = async (): Promise<core.WithRawResponse<api.ContentsUpload>> => {
            // A path that names no file fails with the platform's own error before any request leaves.
            await assertPathExists(upload.document);
            const document = await documentReadOnce(upload.document);
            // The key is made here, not inside billed(), so the wait's errors carry it too: the wait is part of the call.
            const key = upload["Idempotency-Key"] ?? generateIdempotencyKey();
            const prepared: GeneratedGetClean.UploadContentsRequest = {
                ...(document === upload.document ? upload : { ...upload, document }),
                "Idempotency-Key": key,
            };
            const answer = await this.billed(
                "contents",
                "call_seconds",
                (r, o) => super.uploadContents(r, o),
                prepared,
                requestOptions,
            ).withRawResponse();
            if (wait !== true) {
                return answer;
            }
            try {
                return {
                    data: await this.followJob(answer.data, prepared, requestOptions),
                    rawResponse: answer.rawResponse,
                };
            } catch (error) {
                withIdempotencyKey(error, key);
                throw error;
            }
        };
        return core.HttpResponsePromise.fromPromise(send());
    }

    /**
     * Follows the upload's job to its end, then reads its record. The polls and the read carry the caller's headers and
     * abort signal alone, each poll under its own timeout, the wait it asks for plus the margin, and the read under the
     * client's own; a transient failure of either is tried again within the job bound; every error carries the last job
     * seen as `job`.
     */
    private async followJob(
        upload: api.ContentsUpload,
        request: GeneratedGetClean.UploadContentsRequest,
        requestOptions: GeneratedGetClean.RequestOptions | undefined,
    ): Promise<api.ContentsUpload> {
        let job = upload.job;
        if (job == null || upload.contents != null) {
            return upload;
        }
        const deadline = Date.now() + this.layerTimeouts.jobSeconds() * 1000;
        const options = carried(requestOptions);
        // Each poll is one attempt: the runtime's own retries would wait inside the poll past the bound, so the waits
        // between tries are this helper's, each checked against the time that remains.
        const pollOptions: GeneratedGetClean.RequestOptions = {
            ...options,
            timeoutInSeconds: JOB_POLL_WAIT_SECONDS + TIMEOUT_MARGIN_SECONDS,
            maxRetries: 0,
        };
        let tries = 0;
        while (!job.finished && Date.now() < deadline) {
            try {
                job = await super.getJob(job.id, { wait_seconds: JOB_POLL_WAIT_SECONDS }, pollOptions);
                tries = 0;
            } catch (error) {
                tries = await tryAgain(error, job, tries, deadline, options.abortSignal);
            }
        }
        if (!job.finished) {
            return { job, request_id: upload.request_id };
        }
        if (job.contents_id == null) {
            if (job.state === CANCELED_STATE) {
                throw new JobCanceledClass(job);
            }
            if (job.problem != null) {
                const failure = errorForProblem(job.problem);
                withJob(failure, job);
                throw failure;
            }
            return { job, request_id: upload.request_id };
        }
        tries = 0;
        for (;;) {
            try {
                const contents = await super.getContents(
                    job.contents_id,
                    {
                        max_characters: request.max_characters,
                        formats: sentList(request.formats),
                        block_kinds: sentList(request.block_kinds),
                    },
                    { ...options, maxRetries: 0 },
                );
                return { contents, job, request_id: upload.request_id };
            } catch (error) {
                tries = await tryAgain(error, job, tries, deadline, options.abortSignal);
            }
        }
    }

    /** Every page of a section in turn, from getSection, from the first page or from `page_token`, until the last page, which carries no next_page_token. */
    public async *iterSection(
        contentsId: string,
        sectionId: string,
        request: GeneratedGetClean.GetSectionRequest = {},
        requestOptions?: GeneratedGetClean.RequestOptions,
    ): AsyncGenerator<api.SectionContents, void, undefined> {
        let pageToken: string | undefined = request.page_token;
        for (;;) {
            const page: api.SectionContents = await super.getSection(
                contentsId,
                sectionId,
                { ...request, page_token: pageToken },
                requestOptions,
            );
            yield page;
            pageToken = page.next_page_token;
            if (pageToken == null) {
                return;
            }
        }
    }

    public override listJobs(
        request: GeneratedGetClean.ListJobsRequest = {},
        requestOptions?: GeneratedGetClean.RequestOptions,
    ): core.PagePromise<api.Job, api.JobPage> {
        return core.PagePromise.fromPromise(
            super.listJobs(request, requestOptions).then((first) =>
                withoutRepeats(
                    first,
                    (response) => response.jobs ?? [],
                    (response) => response.next_page_token,
                    (pageToken) => super.listJobs({ ...request, page_token: pageToken }, requestOptions),
                ),
            ),
        );
    }

    public override listContents(
        request: GeneratedGetClean.ListContentsRequest = {},
        requestOptions?: GeneratedGetClean.RequestOptions,
    ): core.PagePromise<api.ContentsCompact, api.ContentsPage> {
        return core.PagePromise.fromPromise(
            super.listContents(request, requestOptions).then((first) =>
                withoutRepeats(
                    first,
                    (response) => response.contents ?? [],
                    (response) => response.next_page_token,
                    (pageToken) => super.listContents({ ...request, page_token: pageToken }, requestOptions),
                ),
            ),
        );
    }
}

/**
 * Waits before the wait helper tries a poll or the read again after a transient failure, within the job bound; a failure
 * that ends the helper, or one met at the bound, is thrown with the last job seen on it.
 */
async function tryAgain(
    error: unknown,
    job: api.Job,
    tries: number,
    deadline: number,
    abortSignal: AbortSignal | undefined,
): Promise<number> {
    const wait = helperWait(error, tries, abortSignal);
    if (wait == null || Date.now() + wait * 1000 > deadline) {
        withJob(error, job);
        throw error;
    }
    await sleep(wait, abortSignal);
    return tries + 1;
}

export namespace GetClean {
    /** The upload's request: the generated one with this client's `wait`. */
    export interface UploadContentsRequest extends GeneratedGetClean.UploadContentsRequest {
        /**
         * Follow the job to its end. Off, the answer comes as the wire gives it: `contents` on a 201, `job` on a 202.
         * On, the job is polled up to a minute at a time, each poll under a timeout of its own and carrying your
         * headers and abort signal, until it is final or the job bound and one more minute have passed; then the record
         * is read under this call's `max_characters` and the lists it sent among `formats` and `block_kinds`, carrying
         * your headers and abort signal as well, and the answer carries `contents` and the final `job`. The polls and
         * the read carry none of the upload's query, body or timeout options. A poll or the read that fails with a 429,
         * a 5xx or no answer is tried again within the bound, after the server's wait or a backoff from one second; a
         * 4xx ends the call with that error. A job that failed with no record throws the error class of its problem's
         * status; a job canceled with no record throws JobCanceled; a job still running at the bound is returned as it
         * stands, for the caller to decide. Every error the wait throws carries the last job seen as `job` and the key
         * the upload sent as `idempotencyKey`. Default false.
         */
        wait?: boolean | undefined;
    }

    /** This client's own error, beside the generated ones: the upload's job was canceled before a record was made. */
    export const JobCanceled: typeof JobCanceledClass = JobCanceledClass;
    export type JobCanceled = JobCanceledClass;
}
