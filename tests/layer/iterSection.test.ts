/**
 * The section pager. `iterSection` takes what `getSection` takes, `page_token` included, and yields each page of the
 * section in turn: the first page, then each page the token of the page before asks for, until a page carries no
 * token. It reads no limits, since reading a section is free.
 */

import { BadRequestError } from "../../src/api/errors/index.js";
import type { GetClean } from "../../src/index.js";
import { GET_SECTION_FITS } from "./examples.js";
import { pageToken, problem, Script, settle } from "./support.js";

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

const SECTION_PATH = `/v1/contents/${GET_SECTION_FITS.contents_id}/sections/${GET_SECTION_FITS.section.id}`;
const CONTENTS_ID = GET_SECTION_FITS.contents_id;
const SECTION_ID = GET_SECTION_FITS.section.id;

/**
 * A section too long for one page: the contract's section example (`get_section.fits`) with its size, `characters`,
 * raised from 1810 to 45000, since the example's section fits every bound a read may ask for.
 */
const LONG_SECTION = { ...GET_SECTION_FITS.section, characters: 45_000 };

/** The default bound of a section read, `max_characters` 20000. */
const DEFAULT_BOUND = 20_000;

/**
 * The three pages the server cuts that section into under a bound: each truncated, each but the last carrying the
 * token of the next, each under its own request id, the example's with its last character changed. Everything else
 * is the example's.
 */
function cutPages(bound: number) {
    const page = (n: number) => ({
        ...GET_SECTION_FITS,
        section: LONG_SECTION,
        truncated: true,
        request_id: `${GET_SECTION_FITS.request_id.slice(0, -1)}${n}`,
    });
    return {
        first: { ...page(1), next_page_token: pageToken(LONG_SECTION.id, bound) },
        second: { ...page(2), next_page_token: pageToken(LONG_SECTION.id, 2 * bound) },
        last: page(3),
    };
}

/** Every page iterSection yields for the request. */
async function pagesOf(script: Script, request: GetClean.GetSectionRequest = {}): Promise<GetClean.SectionContents[]> {
    const pages: GetClean.SectionContents[] = [];
    for await (const page of script.client().iterSection(CONTENTS_ID, SECTION_ID, request)) {
        pages.push(page);
    }
    return pages;
}

describe("iterSection", () => {
    it("yields three pages in turn, each request carrying the token of the page before", async () => {
        // The pager asks for the first page, then for each page the token of the page before names, and stops at
        // the page without a token.
        const { first, second, last } = cutPages(DEFAULT_BOUND);
        const script = new Script([
            { method: "GET", path: SECTION_PATH, status: 200, body: first },
            { method: "GET", path: SECTION_PATH, status: 200, body: second },
            { method: "GET", path: SECTION_PATH, status: 200, body: last },
        ]);

        const pages = await pagesOf(script);

        expect(script.calls(), "no read of the limits, three pages").toEqual([
            `GET ${SECTION_PATH}`,
            `GET ${SECTION_PATH}`,
            `GET ${SECTION_PATH}`,
        ]);
        expect(script.query(0), "the first page").toEqual([]);
        expect(script.query(1), "the second page").toEqual([["page_token", first.next_page_token]]);
        expect(script.query(2), "the last page").toEqual([["page_token", second.next_page_token]]);
        expect(pages).toEqual([first, second, last]);
    });

    it("sends max_characters, scope, formats and block_kinds on every page", async () => {
        // iterSection takes what getSection takes, and every page asks with the same parameters, which the token is
        // bound to. The format asked is the example's, markdown, so the pages answer what was asked. The bound,
        // 16000 characters, is the caller's own, other than the default so that it shows on the wire, and under it
        // the long section still makes three pages.
        const { first, second, last } = cutPages(16_000);
        const script = new Script([
            { method: "GET", path: SECTION_PATH, status: 200, body: first },
            { method: "GET", path: SECTION_PATH, status: 200, body: second },
            { method: "GET", path: SECTION_PATH, status: 200, body: last },
        ]);

        await pagesOf(script, {
            max_characters: 16_000,
            scope: "main",
            formats: ["markdown"],
            block_kinds: ["text", "table"],
        });

        const parameters: Array<[string, string]> = [
            ["max_characters", "16000"],
            ["scope", "main"],
            ["formats", "markdown"],
            ["block_kinds", "text"],
            ["block_kinds", "table"],
        ];
        expect(script.query(0)).toEqual(parameters);
        expect(script.query(1)).toEqual([...parameters, ["page_token", first.next_page_token]]);
        expect(script.query(2)).toEqual([...parameters, ["page_token", second.next_page_token]]);
    });

    it("yields one page after one request when the section fits", async () => {
        // A section that fits comes whole on one page with no token: one answer, one request.
        const script = new Script([{ method: "GET", path: SECTION_PATH, status: 200, body: GET_SECTION_FITS }]);

        const pages = await pagesOf(script);

        expect(script.calls()).toEqual([`GET ${SECTION_PATH}`]);
        expect(pages).toEqual([GET_SECTION_FITS]);
    });

    it("starts from the page_token the caller gives", async () => {
        // iterSection takes page_token too, as the first page's token, so a caller resumes a section from a token
        // it kept.
        const { first, second, last } = cutPages(DEFAULT_BOUND);
        const script = new Script([
            { method: "GET", path: SECTION_PATH, status: 200, body: second },
            { method: "GET", path: SECTION_PATH, status: 200, body: last },
        ]);

        const pages = await pagesOf(script, { page_token: first.next_page_token });

        expect(script.query(0), "the caller's token").toEqual([["page_token", first.next_page_token]]);
        expect(script.query(1)).toEqual([["page_token", second.next_page_token]]);
        expect(pages).toEqual([second, last]);
    });

    it("raises a 400 page-token-invalid on a later page as the typed error, after the pages before it", async () => {
        // A token the server no longer takes is refused 400 page-token-invalid, raised as the client's typed error
        // once the pages before it were yielded.
        const { first } = cutPages(DEFAULT_BOUND);
        const refusal = problem("page-token-invalid", { change: { field: "page_token" } });
        const script = new Script([
            { method: "GET", path: SECTION_PATH, status: 200, body: first },
            { method: "GET", path: SECTION_PATH, status: 400, body: refusal },
        ]);
        const pages: GetClean.SectionContents[] = [];

        const iteration = (async () => {
            for await (const page of script.client().iterSection(CONTENTS_ID, SECTION_ID)) {
                pages.push(page);
            }
        })();

        const ended = await settle(iteration);

        expect(script.calls()).toEqual([`GET ${SECTION_PATH}`, `GET ${SECTION_PATH}`]);
        expect(pages, "the first page came before the refusal").toEqual([first]);
        expect(ended).toEqual({ error: expect.any(BadRequestError) });
        const error = (ended as { error: BadRequestError }).error;
        expect(error.statusCode).toBe(400);
        expect(error.body, "the problem as it arrived").toEqual(refusal);
    });
});
