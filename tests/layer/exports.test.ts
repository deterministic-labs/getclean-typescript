/**
 * The names a user imports. The package's entry exports the layer's client and `JobCanceled`; the client's namespace
 * carries every error class of the API as the same classes, `JobCanceled` among them; `JobCanceled` carries the job,
 * names it in its message and is one of the SDK's own errors, so one catch of the SDK's base error takes every error
 * of the API. The types the namespace carries are checked when the tests are compiled, in exports.test-d.ts.
 */

import * as api from "../../src/api/index.js";
import { GetClean as GeneratedGetClean } from "../../src/Client.js";
import * as entry from "../../src/index.js";
import { GetClean, GetCleanError, JobCanceled } from "../../src/index.js";
import { GetClean as LayerGetClean } from "../../src/wrapper/GetClean.js";
import { JobCanceled as LayerJobCanceled } from "../../src/wrapper/JobCanceled.js";
import { BASE_URL, canceledJobWithoutRecord, problem, RUNNING_JOB } from "./support.js";

/** A job canceled before a record was made: the contract's canceled job, with no record. */
const CANCELED = canceledJobWithoutRecord() as unknown as api.Job;

/**
 * The fifteen statuses the contract answers a problem with, from 400 to 504, the error class of each, and a problem
 * type the contract gives that status.
 */
const ERROR_CLASSES: Array<[string, number, string]> = [
    ["BadRequestError", 400, "page-token-invalid"],
    ["UnauthorizedError", 401, "unauthorized"],
    ["ForbiddenError", 403, "insufficient-scope"],
    ["NotFoundError", 404, "not-found"],
    ["ConflictError", 409, "record-without-content"],
    ["GoneError", 410, "job-expired"],
    ["ContentTooLargeError", 413, "body-too-large"],
    ["UnsupportedMediaTypeError", 415, "unsupported-media-type"],
    ["UnprocessableEntityError", 422, "invalid-field"],
    ["TooManyRequestsError", 429, "rate-limit-exceeded"],
    ["UnavailableForLegalReasonsError", 451, "legal-block"],
    ["InternalServerError", 500, "internal-error"],
    ["BadGatewayError", 502, "gateway-error"],
    ["ServiceUnavailableError", 503, "overloaded"],
    ["GatewayTimeoutError", 504, "gateway-timeout"],
];

describe("the package's entry", () => {
    it("exports the layer's client and the layer's JobCanceled, never the bare generated client", () => {
        // `import { GetClean, JobCanceled } from "getclean"` gives the client with the layer on top of the generated
        // one, and the layer's own error.
        expect(entry.GetClean, "the layer's client itself").toBe(LayerGetClean);
        expect(entry.GetClean, "not the bare generated client").not.toBe(GeneratedGetClean);
        expect(
            new entry.GetClean({ apiKey: "a-test-key", baseUrl: BASE_URL }),
            "the generated client, with the layer",
        ).toBeInstanceOf(GeneratedGetClean);
        expect(entry.JobCanceled, "the layer's error itself").toBe(LayerJobCanceled);
    });
});

describe("the client's namespace", () => {
    it("carries JobCanceled as the same class the entry exports", () => {
        // GetClean.JobCanceled and the exported JobCanceled are one class, so instanceof holds either way.
        expect(GetClean.JobCanceled).toBe(JobCanceled);
        expect(new GetClean.JobCanceled(CANCELED)).toBeInstanceOf(JobCanceled);
        expect(new JobCanceled(CANCELED)).toBeInstanceOf(GetClean.JobCanceled);
    });

    it("carries every error class of the API as the same class, one for each status the contract answers a problem with", () => {
        // The classes the client raises are the API's own, each one of the SDK's errors and each with its status.
        const errorClasses = Object.entries(api).flatMap(([name, value]) =>
            typeof value === "function" && value.prototype instanceof GetCleanError ? [name] : [],
        );
        expect(errorClasses.sort(), "the API's error classes").toEqual(ERROR_CLASSES.map(([name]) => name).sort());
        for (const [name, status, type] of ERROR_CLASSES) {
            const carried = (GetClean as unknown as Record<string, unknown>)[name];
            expect(carried, `GetClean.${name}`).toBe((api as unknown as Record<string, unknown>)[name]);
            const ErrorClass = carried as new (body: api.Problem) => GetCleanError;
            const error = new ErrorClass(problem(type) as unknown as api.Problem);
            expect(error, `a ${name} is one of the SDK's errors`).toBeInstanceOf(GetCleanError);
            expect(error.statusCode, `the status of a ${name}`).toBe(status);
        }
    });
});

describe("JobCanceled", () => {
    it("carries the job and names its id in the message", () => {
        // JobCanceled is a typed error carrying the Job, so the caller holds the job and its id.
        const error = new JobCanceled(CANCELED);

        expect(error.job).toEqual(CANCELED);
        expect(error.message).toContain(RUNNING_JOB.id);
        expect(error.name).toBe("JobCanceled");
    });

    it("is one of the SDK's own errors, a GetCleanError", () => {
        // JobCanceled extends the SDK's base error, so one catch of GetCleanError takes every error of the API.
        expect(new JobCanceled(CANCELED)).toBeInstanceOf(GetCleanError);
    });
});
