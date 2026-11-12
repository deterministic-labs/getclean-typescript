/**
 * The forms of the upload's document. The upload takes `document` as a path, bytes or a stream, as the generated
 * client takes them: the file's bytes reach the wire, under the file's name where the form carries one, whether or not
 * `wait` is set, and the layer adds nothing to them. A stream is read into memory once before the first attempt, so
 * every attempt sends the same bytes under the same key.
 */

import { createReadStream, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { GetClean as GeneratedGetClean } from "../../src/Client.js";
import type { GetClean } from "../../src/index.js";
import { GET_LIMITS_LIMITS, UPLOAD_CONTENTS_DELIVERED } from "./examples.js";
import { asksToWait, BASE_URL, MINUTES_PDF, Script, type Step, settle } from "./support.js";

/** The contract's sample document, written to a folder of its own for the forms that read a path. */
const folder = mkdtempSync(join(tmpdir(), "getclean-upload-"));
const MINUTES_PATH = join(folder, "minutes.pdf");
writeFileSync(MINUTES_PATH, MINUTES_PDF);

afterAll(() => {
    rmSync(folder, { recursive: true });
});

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

const UPLOAD_PATH = "/v1/contents:upload";
const LIMITS: Step = { method: "GET", path: "/v1/limits", status: 200, body: GET_LIMITS_LIMITS };
const DELIVERED: Step = { method: "POST", path: UPLOAD_PATH, status: 201, body: UPLOAD_CONTENTS_DELIVERED };

/** A form of the document, made fresh for each upload, since a stream is read once. */
type DocumentForm = { form: string; make: () => GetClean.UploadContentsRequest["document"] };

/** Every form the generated client takes, each holding the bytes of the sample document. */
const FORMS: DocumentForm[] = [
    { form: "a path", make: () => ({ path: MINUTES_PATH }) },
    { form: "a Buffer", make: () => Buffer.from(MINUTES_PDF) },
    { form: "a Uint8Array", make: () => new TextEncoder().encode(MINUTES_PDF) },
    { form: "a Blob", make: () => new Blob([MINUTES_PDF], { type: "application/pdf" }) },
    { form: "a File", make: () => new File([MINUTES_PDF], "minutes.pdf", { type: "application/pdf" }) },
    { form: "a file stream", make: () => createReadStream(MINUTES_PATH) },
    { form: "a Node stream", make: () => Readable.from([Buffer.from(MINUTES_PDF)]) },
    {
        form: "a web stream",
        make: () =>
            new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode(MINUTES_PDF));
                    controller.close();
                },
            }),
    },
    {
        form: "bytes with a name and a type",
        make: () => ({ data: Buffer.from(MINUTES_PDF), filename: "minutes.pdf", contentType: "application/pdf" }),
    },
];

/** The document part of an upload request: its file name, its media type and its bytes as text. */
async function documentPart(request: Request | undefined): Promise<{ name: string; type: string; text: string }> {
    const form = await request?.formData();
    const part = form?.get("document");
    if (!(part instanceof File)) {
        return { name: "no document part", type: "", text: "" };
    }
    return { name: part.name, type: part.type, text: await part.text() };
}

describe("each form of the document", () => {
    it.each(FORMS)("sends $form as the generated client sends it, the sample's bytes whole", async ({ make }) => {
        // The layer adds nothing to the document: the part the layer sends equals the part the generated client
        // sends for the same form, and holds the file's bytes.
        const throughTheLayer = new Script([LIMITS, DELIVERED]);
        const throughTheGeneratedClient = new Script([DELIVERED]);

        const layered = await settle(throughTheLayer.client().uploadContents({ document: make() }));
        const generated = await settle(
            new GeneratedGetClean({
                apiKey: "a-test-key",
                baseUrl: BASE_URL,
                fetch: throughTheGeneratedClient.fetch,
            }).uploadContents({
                document: make(),
            }),
        );

        expect(throughTheLayer.calls()).toEqual(["GET /v1/limits", `POST ${UPLOAD_PATH}`]);
        const sent = await documentPart(throughTheLayer.requests[1]);
        expect(sent.text, "the sample's bytes, whole").toBe(MINUTES_PDF);
        expect(sent, "the part the generated client sends").toEqual(
            await documentPart(throughTheGeneratedClient.requests[0]),
        );
        expect(layered).toEqual({ value: UPLOAD_CONTENTS_DELIVERED });
        expect(generated).toEqual({ value: UPLOAD_CONTENTS_DELIVERED });
    });

    it.each(
        FORMS.filter(({ form }) =>
            ["a path", "a File", "a file stream", "bytes with a name and a type"].includes(form),
        ),
    )("sends $form under the file's own name", async ({ make }) => {
        // A path is the file at that path, sent under its base name; a form that carries a name sends it.
        const script = new Script([LIMITS, DELIVERED]);

        await settle(script.client().uploadContents({ document: make() }));

        expect((await documentPart(script.requests[1])).name).toBe("minutes.pdf");
    });

    it.each([
        ["unset", undefined],
        ["false", false],
        ["true", true],
    ])("means the file at a path when wait is %s", async (_case, wait) => {
        // A path means the file at that path whether or not wait is set, sent under its base name and as the media
        // type the contract's encoding names for the document part, application/octet-stream.
        const script = new Script([LIMITS, DELIVERED]);

        const ended = await settle(script.client().uploadContents({ document: { path: MINUTES_PATH }, wait }));

        expect(await documentPart(script.requests[1])).toEqual({
            name: "minutes.pdf",
            type: "application/octet-stream",
            text: MINUTES_PDF,
        });
        expect(ended).toEqual({ value: UPLOAD_CONTENTS_DELIVERED });
    });
});

describe("a document sent again", () => {
    it.each(FORMS)("sends $form whole on both attempts when an in-flight 409 is retried", async ({ make }) => {
        // Every attempt sends the same bytes under the same key: a stream is read once, before the first attempt;
        // a path is opened again; bytes are sent as they are.
        const script = new Script([
            LIMITS,
            { method: "POST", path: UPLOAD_PATH, ...asksToWait("idempotency-key-in-flight", 1) },
            DELIVERED,
        ]);

        const ended = settle(script.client().uploadContents({ document: make() }));
        // A path is read from the disk before the first attempt goes out; the call may also end before it does.
        await Promise.race([script.sent(2), ended]);
        await vi.advanceTimersByTimeAsync(1000);
        // A path is read from the disk again for the second attempt, which the test's clock does not stand for.
        const outcome = await ended;

        expect(script.calls()).toEqual(["GET /v1/limits", `POST ${UPLOAD_PATH}`, `POST ${UPLOAD_PATH}`]);
        const [first, second] = [await documentPart(script.requests[1]), await documentPart(script.requests[2])];
        expect(first.text, "the first attempt's document").toBe(MINUTES_PDF);
        expect(second, "the second attempt's document, the same part").toEqual(first);
        const keys = script.headers(UPLOAD_PATH, "Idempotency-Key");
        expect(keys[1], "the same key").toBe(keys[0]);
        expect(outcome).toEqual({ value: UPLOAD_CONTENTS_DELIVERED });
    });
});

describe("a path that does not exist", () => {
    it("fails with the platform's file-not-found error, before any request", async () => {
        // A path names a file; when there is none, the caller learns it from the platform's own error, and nothing
        // is sent for an upload that cannot be made.
        const missing = join(folder, "no-such-minutes.pdf");
        const script = new Script([LIMITS, DELIVERED]);

        const ended = await settle(script.client().uploadContents({ document: { path: missing } }));

        expect(ended).toEqual({ error: expect.objectContaining({ code: "ENOENT", path: missing }) });
        expect(script.calls(), "no request").toEqual([]);
    });
});
