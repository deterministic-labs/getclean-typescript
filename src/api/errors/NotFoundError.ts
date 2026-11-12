// Generated from the getclean API contract; do not edit.

import type * as core from "../../core/index.js";
import * as errors from "../../errors/index.js";
import type * as GetClean from "../index.js";

export class NotFoundError extends errors.GetCleanError {
    public declare readonly body: GetClean.Problem;

    constructor(body: GetClean.Problem, rawResponse?: core.RawResponse) {
        super({
            message: "NotFoundError",
            statusCode: 404,
            body: body,
            rawResponse: rawResponse,
        });
        Object.setPrototypeOf(this, new.target.prototype);
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }

        this.name = "NotFoundError";
    }
}
