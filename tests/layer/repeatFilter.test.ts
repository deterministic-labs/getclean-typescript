/**
 * The repeat filter. The lists of jobs and of records grow while a caller pages through them, so an item may come
 * again on a later page. listJobs and listContents give each id once, pass over a page that holds only repeats, end
 * with no error when the last page holds only repeats, and keep each page's own members on the page object. The same
 * holds item by item through `for await` and page by page through `getNextPage()`.
 */

import type { GetClean } from "../../src/index.js";
import { LIST_CONTENTS_FIRST_PAGE, LIST_JOBS_FIRST_PAGE } from "./examples.js";
import { pageToken, Script, type Step } from "./support.js";

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

/** What a test reads of a pager's page. */
interface ListedPage {
    data: Array<{ id: string }>;
    response: { notices: GetClean.Notice[]; request_id: string };
    hasNextPage(): boolean;
    getNextPage(): Promise<ListedPage>;
    [Symbol.asyncIterator](): AsyncIterator<{ id: string }>;
}

/** A list that grows while it pages, the three items it shows, and how a caller asks for it with a filter. */
type Listing = {
    method: string;
    path: string;
    member: "jobs" | "contents";
    /** The request id of the list's example page, the first page's here. */
    requestId: string;
    /**
     * Three items: the list example's one item, then the same item under two other ids, as items made while the
     * caller pages, since the contract's list examples show one item each.
     */
    items: [Record<string, unknown>, Record<string, unknown>, Record<string, unknown>];
    /** The item as a page lists it: a job carries the id of the call it came back in, its page's request id. */
    onPage: (item: Record<string, unknown>, requestId: string) => Record<string, unknown>;
    filter: Array<[string, string]>;
    /** Asks for the list with the filter, and with a page size when one is given. */
    list: (client: GetClean, pageSize?: number) => Promise<ListedPage>;
};

const [LISTED_JOB] = LIST_JOBS_FIRST_PAGE.jobs;
const [LISTED_RECORD] = LIST_CONTENTS_FIRST_PAGE.contents;

const LISTINGS: Listing[] = [
    {
        method: "listJobs",
        path: "/v1/jobs",
        member: "jobs",
        requestId: LIST_JOBS_FIRST_PAGE.request_id,
        items: [
            LISTED_JOB,
            { ...LISTED_JOB, id: "job_2Hc7XyQe0rTmVq4uBkLs9N" },
            { ...LISTED_JOB, id: "job_5Wn3PaZd8fJcKe1yMhGt6R" },
        ],
        onPage: (item, requestId) => ({ ...item, request_id: requestId }),
        filter: [
            ["state", "completed"],
            ["kind", "upload_contents"],
        ],
        list: (client, pageSize) =>
            client.listJobs({
                state: "completed",
                kind: "upload_contents",
                ...(pageSize == null ? {} : { page_size: pageSize }),
            }),
    },
    {
        method: "listContents",
        path: "/v1/contents",
        member: "contents",
        requestId: LIST_CONTENTS_FIRST_PAGE.request_id,
        items: [
            LISTED_RECORD,
            { ...LISTED_RECORD, id: "cnt_8Lm2QsWc4vXbNa7tRyEj5K" },
            { ...LISTED_RECORD, id: "cnt_1Pd9KfHu6gTzMw3eQsVx2B" },
        ],
        onPage: (item) => item,
        filter: [
            ["url", "https://example.com/*"],
            ["carrier", "web"],
        ],
        list: (client, pageSize) =>
            client.listContents({
                url: "https://example.com/*",
                carrier: "web",
                ...(pageSize == null ? {} : { page_size: pageSize }),
            }),
    },
];

/** The request id of a page: the example's on the first page, the example's with its last character changed after. */
function requestIdOf(listing: Listing, number: number): string {
    return number === 1 ? listing.requestId : `${listing.requestId.slice(0, -1)}${number}`;
}

/** A page of the list holding these items, carrying the token of the next page when one follows. */
function page(
    listing: Listing,
    items: Array<Record<string, unknown>>,
    number: number,
    nextPageToken?: string,
    notices: GetClean.Notice[] = [],
): Step {
    const requestId = requestIdOf(listing, number);
    const token = nextPageToken == null ? {} : { next_page_token: nextPageToken };
    return {
        method: "GET",
        path: listing.path,
        status: 200,
        body: {
            [listing.member]: items.map((item) => listing.onPage(item, requestId)),
            ...token,
            notices,
            request_id: requestId,
        },
    };
}

/** The ids of every item, read through `for await`. */
async function idsThroughForAwait(first: ListedPage): Promise<string[]> {
    const ids: string[] = [];
    for await (const item of first) {
        ids.push(item.id);
    }
    return ids;
}

/** The ids of each page, read page by page through `getNextPage()`. */
async function pagesThroughGetNextPage(first: ListedPage): Promise<string[][]> {
    const pages = [first.data.map((item) => item.id)];
    let current = first;
    while (current.hasNextPage()) {
        current = await current.getNextPage();
        pages.push(current.data.map((item) => item.id));
    }
    return pages;
}

describe.each(LISTINGS)("$method", (listing) => {
    const [a, b, c] = listing.items;
    const [idA, idB, idC] = listing.items.map((item) => String(item.id));
    /** Tokens in the form of the contract's example token, naming where the second and the third page start. */
    const SECOND_PAGE = pageToken(listing.member, 2);
    const THIRD_PAGE = pageToken(listing.member, 4);

    it("gives an id that comes on two pages once, through for await", async () => {
        // The list grows while it pages, so an item may come again; the pager drops it by id.
        const script = new Script([page(listing, [a, b], 1, SECOND_PAGE), page(listing, [b, c], 2)]);

        const ids = await idsThroughForAwait(await listing.list(script.client()));

        expect(script.calls()).toEqual([`GET ${listing.path}`, `GET ${listing.path}`]);
        expect(script.query(0), "the caller's filter").toEqual(listing.filter);
        expect(script.query(1), "the filter and the token of the page before").toEqual([
            ...listing.filter,
            ["page_token", SECOND_PAGE],
        ]);
        expect(ids).toEqual([idA, idB, idC]);
    });

    it("gives an id that comes on two pages once, through getNextPage", async () => {
        // Page by page, the later page holds only the items not seen before.
        const script = new Script([page(listing, [a, b], 1, SECOND_PAGE), page(listing, [b, c], 2)]);

        const pages = await pagesThroughGetNextPage(await listing.list(script.client()));

        expect(script.calls()).toEqual([`GET ${listing.path}`, `GET ${listing.path}`]);
        expect(pages).toEqual([[idA, idB], [idC]]);
    });

    it("passes over a page that holds only repeats, through for await", async () => {
        // A page whose every item came before is passed over, and the items after it still come.
        const script = new Script([
            page(listing, [a, b], 1, SECOND_PAGE),
            page(listing, [a, b], 2, THIRD_PAGE),
            page(listing, [c], 3),
        ]);

        const ids = await idsThroughForAwait(await listing.list(script.client()));

        expect(script.calls()).toHaveLength(3);
        expect(script.query(1), "the token of the page of repeats").toEqual([
            ...listing.filter,
            ["page_token", SECOND_PAGE],
        ]);
        expect(script.query(2), "the token the page of repeats gave").toEqual([
            ...listing.filter,
            ["page_token", THIRD_PAGE],
        ]);
        expect(ids).toEqual([idA, idB, idC]);
    });

    it("passes over a page that holds only repeats, through getNextPage: the caller sees two pages", async () => {
        // Page by page too, the page of repeats is passed over: the caller sees the page before it and the page
        // after it.
        const script = new Script([
            page(listing, [a, b], 1, SECOND_PAGE),
            page(listing, [a, b], 2, THIRD_PAGE),
            page(listing, [c], 3),
        ]);

        const pages = await pagesThroughGetNextPage(await listing.list(script.client()));

        expect(script.calls()).toHaveLength(3);
        expect(script.query(1), "the token of the page of repeats").toEqual([
            ...listing.filter,
            ["page_token", SECOND_PAGE],
        ]);
        expect(script.query(2), "the token the page of repeats gave").toEqual([
            ...listing.filter,
            ["page_token", THIRD_PAGE],
        ]);
        expect(pages, "two pages, the page of repeats passed over").toEqual([[idA, idB], [idC]]);
    });

    it("ends with no error when the last page holds only repeats, through for await", async () => {
        // The last page may hold only repeats; the iteration ends there and raises nothing.
        const script = new Script([page(listing, [a, b], 1, SECOND_PAGE), page(listing, [b], 2)]);

        const ids = await idsThroughForAwait(await listing.list(script.client()));

        expect(script.calls()).toHaveLength(2);
        expect(ids).toEqual([idA, idB]);
    });

    it("ends with no error when the last page holds only repeats, through getNextPage", async () => {
        // Page by page, the pager ends after the last page and raises nothing.
        const script = new Script([page(listing, [a, b], 1, SECOND_PAGE), page(listing, [b], 2)]);

        const pages = await pagesThroughGetNextPage(await listing.list(script.client()));

        expect(script.calls()).toHaveLength(2);
        expect(pages.flat(), "every id once").toEqual([idA, idB]);
    });

    it("keeps each page's own members on the page: response.notices and response.request_id", async () => {
        // A page's own members are read from the page object the pager holds, page.response.
        // The caller asks for 500 a page, above the maximum of 200, so every page carries the notice that lowered it.
        // The message is the contract's own sentence for this notice, from its table of notice codes.
        const lowered: GetClean.Notice = {
            code: "page_size_lowered",
            message: "page_size was above the maximum and was lowered, never refused.",
            field: "page_size",
        };
        const steps = [
            page(listing, [a, b], 1, SECOND_PAGE, [lowered]),
            page(listing, [a, b], 2, THIRD_PAGE, [lowered]),
            page(listing, [c], 3, undefined, [lowered]),
        ];
        const script = new Script(steps);

        const first = await listing.list(script.client(), 500);
        const seen = [{ notices: first.response.notices, request_id: first.response.request_id }];
        let current = first;
        while (current.hasNextPage()) {
            current = await current.getNextPage();
            seen.push({ notices: current.response.notices, request_id: current.response.request_id });
        }

        expect(seen.at(0), "the first page's own members").toEqual({
            notices: [lowered],
            request_id: requestIdOf(listing, 1),
        });
        expect(seen.at(-1), "the last page's own members").toEqual({
            notices: [lowered],
            request_id: requestIdOf(listing, 3),
        });
    });

    it("sends no request beyond the first when the pager is not iterated", async () => {
        // Awaiting the list gives the first page; the next page is asked for only when the caller goes on.
        const script = new Script([page(listing, [a, b], 1, SECOND_PAGE), page(listing, [c], 2)]);

        const first = await listing.list(script.client());
        await vi.advanceTimersByTimeAsync(60_000);

        expect(script.calls()).toEqual([`GET ${listing.path}`]);
        expect(first.data.map((item) => item.id)).toEqual([idA, idB]);
    });
});
