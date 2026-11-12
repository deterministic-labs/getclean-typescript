/**
 * The types a user names through the client's namespace. These are checked when the tests are compiled: a wrong type
 * fails the compile, since a type leaves nothing to check when the tests run.
 */

import type * as api from "../../src/api/index.js";
import type { GetClean as GeneratedGetClean } from "../../src/Client.js";
import type { GetClean, GetCleanError } from "../../src/index.js";

it("names the API's types through the client's namespace, the upload's request with its wait among them", () => {
    // GetClean.Contents is the record's type, and GetClean.UploadContentsRequest is the generated request with the
    // wait helper's `wait`.
    expectTypeOf<GetClean.Contents>().toEqualTypeOf<api.Contents>();
    expectTypeOf<GetClean.UploadContentsRequest>().toHaveProperty("wait").toEqualTypeOf<boolean | undefined>();
    expectTypeOf<GetClean.UploadContentsRequest>().toExtend<GeneratedGetClean.UploadContentsRequest>();
});

it("declares the key and the job this client leaves on an error, so a caller reads them without a cast", () => {
    expectTypeOf<GetCleanError>().toHaveProperty("idempotencyKey").toEqualTypeOf<string | undefined>();
    expectTypeOf<GetCleanError>().toHaveProperty("job").toEqualTypeOf<api.Job | undefined>();
});
