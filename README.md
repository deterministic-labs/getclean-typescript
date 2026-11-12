# getclean for TypeScript

The official TypeScript SDK for getclean, the data layer for research agents. It fetches web pages and documents as clean, exact text with the facts of their source, searches the web and specialist sources with a receipt of what ran, and says in every record what happened and in every billed answer what it cost.

## Install

```sh
npm install getclean
```

Node.js 20 or later. The package ships as ES modules and CommonJS, with its type declarations, so `import` and `require` both work and every call and answer is typed.

## A key

A key comes from `https://app.getclean.ai`. The client reads it from the environment variable `GETCLEAN_API_KEY` when you give none, or takes it as `apiKey`.

```typescript
import { GetClean } from "getclean";

const client = new GetClean();
```

```typescript
import { GetClean } from "getclean";

const client = new GetClean({ apiKey: "..." }); // the key as app.getclean.ai shows it
```

A program that signs in can pass a function instead of a value. It is called once per call, and its answer, an API key or an access token, goes out on every attempt of that call.

```typescript
import { GetClean } from "getclean";

async function currentToken(): Promise<string> {
    return "..."; // the access token your sign-in returns
}

const client = new GetClean({ apiKey: currentToken });
```

A client built with no key throws `GetCleanError` before any request leaves, and its message says to pass `apiKey` to the client or to set `GETCLEAN_API_KEY`.

The host is `https://api.getclean.ai`. To point the client elsewhere, at a test server for example, pass `baseUrl` or set `GETCLEAN_BASE_URL`.

## The first call

`fetchContents` reads a page as a record: its text as Markdown, the words you asked it to find, and a summary when you ask for one. Read the answer in the order it comes: what happened, then the text, then the cost.

```typescript
import { GetClean } from "getclean";

const client = new GetClean();

const contents = await client.fetchContents({
    url: "https://example.com/q3",
    highlights: ["Revenue rose 12%", "what drove the margin"],
    summary: true,
});

console.log(contents.outcome.kind, contents.outcome.reason);
if (contents.outcome.kind === "delivered") {
    console.log(contents.markdown);
    console.log(contents.summary);
}
if (contents.cost) {
    console.log(contents.cost.actual.amount, contents.cost.actual.currency);
}
console.log(contents.id, contents.expires_at);
```

The text of a record is a third party's, as the source wrote it, and it may carry instructions. A program that hands `markdown` to a model should give it as material to read, never as a message to obey. The contract's [page for agents](https://github.com/deterministic-labs/getclean-api/blob/main/docs/agents.md) says how to read an answer and what a refusal means.

A page that could not be fetched is still a record, not an exception. Its `outcome.kind` is `failed`, `refused` or `needs_person`, and `outcome.reason` says why, so the check above is the one your program needs. `cost` is on every billed answer and absent from a free read. The record's `id` names it from now on. It is kept 48 hours after its last call and at most 30 days, `expires_at` says until when, and every later read of it is free.

## Read the record again

A record is read by its id, free, in the shape you need: the map of its sections without text, one section, or only the blocks of one kind. A list that may run over several pages comes back as a pager: iterate it with `for await` for the items, and read the page's own members on `response`.

```typescript
import { GetClean } from "getclean";

const client = new GetClean();
const contentsId = "cnt_3Fk9abaUhNX7t2eKkgfd3e";

const record = await client.getContents(contentsId, { max_characters: 0 });
for (const section of record.sections ?? []) {
    console.log(section.id, section.level, section.title);
}

const margin = await client.getSection(contentsId, "s2");
console.log(margin.section.title, margin.markdown);

const blocks = await client.listBlocks(contentsId, { block_kinds: ["table"] });
for await (const block of blocks) {
    console.log(block.id, block.kind, block.table);
}
console.log(blocks.response.fingerprint, blocks.response.notices);
```

A long section is cut into pages. `iterSection` reads them one after another, each page asked with the token of the page before it, until the last.

```typescript
import { GetClean } from "getclean";

const client = new GetClean();

for await (const page of client.iterSection("cnt_3Fk9abaUhNX7t2eKkgfd3e", "s2", { max_characters: 5000 })) {
    console.log(page.markdown);
}
```

Every method and every parameter is listed in [reference.md](./reference.md).

## Search

`search` runs one question across the web and specialist sources, ranks what it finds, and can fetch the top results as records in the same call. The answer carries the candidates in rank order and a receipt of every source searched.

```typescript
import { GetClean } from "getclean";

const client = new GetClean();

const search = await client.search({
    query: "EU AI Act article 50 marking obligations",
    published_within_days: 365,
    max_candidates: 3,
    contents: { top: 1, max_characters: 8000 },
    max_cost: { amount: "0.1000", currency: "USD" },
});

for (const candidate of search.candidates) {
    console.log(candidate.relevance_score, candidate.title, candidate.url);
    console.log(candidate.source_profile.kind, candidate.source_profile.role);
    if (candidate.contents?.truncated) {
        for (const section of candidate.contents.sections ?? []) {
            console.log(section.id, section.title, section.characters);
        }
    } else if (candidate.contents) {
        console.log(candidate.contents.markdown);
    }
}
for (const receipt of search.datasources_searched ?? []) {
    console.log(receipt.id, receipt.outcome.kind);
}

const stored = await client.getSearch(search.id);
console.log(stored.response.outcome.kind, stored.response.candidates.length);
```

A fetched candidate carries its text as `markdown` when it fit under `max_characters`. When it did not, `truncated` is true and `sections` is the map of the content instead, one row per section with its size; `getSection` then reads the section you need.

The stored list is read again with `getSearch`, free. It comes back as a pager over the same candidates: iterate it for the candidates, or read the page itself on `response`.

## Upload a document

`uploadContents` sends a file from your machine. Give `document` a path, a `Buffer`, a `Blob`, a `File` or a readable stream. A short document is answered at once with `contents`. A longer one is parsed as a job: with `wait: true` the client follows the job and reads the record for you.

```typescript
import { GetClean } from "getclean";

const client = new GetClean();

const result = await client.uploadContents({ document: { path: "minutes.pdf" }, wait: true });
if (result.contents) {
    console.log(result.contents.outcome.kind, result.contents.cost);
} else if (result.job) {
    console.log(result.job.id, result.job.state);
}
```

With `wait: true` the client polls the job up to a minute at a time, within the job bound, then reads the record. A job that failed with no record throws the typed error of its problem's status; a job canceled before any record exists throws `JobCanceled`, which carries the job. A job still running at the bound comes back as it stands, as the second branch above shows.

Without `wait`, follow the job yourself: `getJob` reads it, waiting up to `wait_seconds` until the job is final or the wait ends, and `getContents` reads the record once `contents_id` is set.

```typescript
import { GetClean } from "getclean";

const client = new GetClean();

const result = await client.uploadContents({ document: { path: "minutes.pdf" } });
if (result.job) {
    const job = await client.getJob(result.job.id, { wait_seconds: 60 });
    console.log(job.state, job.finished, job.contents_id);
}
```

An upload is billed in units: one `contents`, one `document_pages` for each page parsed, one `recognized_pages` for each page recognized from its image, and one `model_steps` for each model field that ran. `getLimits` shows the price of each unit.

## Errors

An HTTP refusal is a typed error, one class per status, each a member of `GetClean`: `GetClean.BadRequestError`, `GetClean.UnauthorizedError`, `GetClean.ForbiddenError`, `GetClean.NotFoundError`, `GetClean.ConflictError`, `GetClean.GoneError`, `GetClean.ContentTooLargeError`, `GetClean.UnsupportedMediaTypeError`, `GetClean.UnprocessableEntityError`, `GetClean.TooManyRequestsError`, `GetClean.UnavailableForLegalReasonsError`, `GetClean.InternalServerError`, `GetClean.BadGatewayError`, `GetClean.ServiceUnavailableError` and `GetClean.GatewayTimeoutError`. Each carries the API's answer as `body`, a `Problem`: `type` names what happened, `title` and `detail` say it in words, `who_must_act` says whether you, the account owner or the service must act, `retryable` says whether asking again can help, and `change`, where the fix is in your request, names the field and the move. The error's message begins with the title and the detail, as in `A field is invalid: formats holds a value outside its set.`, and carries the status and the body after them.

```typescript
import { GetClean, GetCleanError } from "getclean";

const client = new GetClean();

try {
    const contents = await client.fetchContents({ url: "https://example.com/q3" });
    console.log(contents.outcome.kind);
} catch (error) {
    if (error instanceof GetClean.ConflictError) {
        const problem = error.body;
        console.log(problem.type, problem.title, problem.detail);
        console.log(problem.who_must_act, problem.retryable, problem.change);
    } else if (error instanceof GetCleanError) {
        console.log(error.statusCode, error.body);
    } else {
        throw error;
    }
}
```

`GetCleanError` is the base of every typed error, so one `instanceof` check catches them all. `JobCanceled` is the SDK's own and carries no status.

## Retries, the key and timeouts

The client retries on its own what a retry can help: `429`, `502`, `503`, `504`, and a `409` whose problem type is `idempotency-key-in-flight`, the answer to a call repeated while its first attempt still runs. One call makes at most five attempts in all. Between attempts it waits as the server's `Retry-After` asks when that is 30 seconds or less, else one second, doubling, never past 30. A `Retry-After` past 30 seconds ends the retries, and the answer comes back to you with `retry_after_seconds` on its body, for your program to decide. `maxRetries`, on the client or in the request options, changes the count.

Every call that may bill carries one idempotency key, the same on every attempt. The client makes one when you give none, so a retry is a replay of the first attempt and never a second charge. When the call fails, the key is on the error as `idempotencyKey`. Give your own key as the request's `Idempotency-Key` when your program retries across processes, and the API answers the first call's result again.

```typescript
import { GetClean } from "getclean";

const client = new GetClean();
const order = "order-7"; // your own id for the piece of work this call belongs to

const contents = await client.fetchContents(
    { url: "https://example.com/q3", "Idempotency-Key": `${order}:fetch-q3` },
    {
        headers: { traceparent: "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01" },
    },
);
if (contents.cost) {
    console.log(contents.cost.replayed);
}
```

Each attempt runs under a timeout of its own: 120 seconds until the client has read your limits, then, for a call that may bill, the API's own bound for that kind of call plus ten seconds, `call_seconds` for a single call and `batch_seconds` for a batch; a free call keeps 120 seconds. A timeout you set, on the client or in the request options as `timeoutInSeconds`, always stands. Headers you add through the request options, `traceparent` among them, go on the call and on every poll and read made for it, and so does an `abortSignal`.

## Money

Every call that bills states its cost before and after: `cost.ceiling` is the most it could cost, `cost.actual` what it did. `max_cost` caps one call below the key's cap; the key's cap applies when you give none. `getLimits` reads the account's balance, the caps, the price of each unit and the bounds of every parameter, free.

```typescript
import { GetClean } from "getclean";

const client = new GetClean();

const limits = await client.getLimits();
console.log(limits.balance.amount, limits.balance.currency);
console.log(limits.caps.call_cap.amount);
console.log(limits.prices["contents"]?.amount, limits.prices["model_steps"]?.amount);
console.log(limits.bounds.contents["max_characters"]?.max);

const contents = await client.fetchContents({
    url: "https://example.com/q3",
    max_cost: { amount: "0.10", currency: "USD" },
});
if (contents.cost) {
    console.log(contents.cost.actual.amount, contents.cost.ceiling);
}
```

Four refusals are about money, and each says in `who_must_act` who must act: `credit-exhausted` when the account's credit is spent, `run-budget-exhausted` and `key-budget-exhausted` when a run's or the key's budget is used up, all three answered 403, and `cost-exceeds-cap`, answered 422, when the cap is below the smallest possible charge. A call repeated under the same key and body within 24 hours is answered again from the first result, with `cost.replayed` true and nothing billed twice.

## Promises, raw responses and cancellation

Every method returns a promise. `.withRawResponse()` on that promise gives the parsed answer as `data` beside the HTTP status and headers. An `abortSignal` in the request options cancels a call, its retries, and the polls of an upload's wait.

```typescript
import { GetClean } from "getclean";

const client = new GetClean();

const { data, rawResponse } = await client.getLimits().withRawResponse();
console.log(rawResponse.status, rawResponse.headers.get("request-id"), data.balance.amount);

const controller = new AbortController();
const limits = await client.getLimits({ abortSignal: controller.signal });
console.log(limits.caps.call_cap.amount);
```

## Versioning

This is getclean for TypeScript 0.1.0, built against version 1.0.3 of the getclean API contract. The package's version starts at 0.1.0 and moves to 1.0.0 with the service's first release. A minor change of the contract gives it a minor version; a change in this package alone, in its code, its tests or its documents, gives it a patch version. The version in the package's metadata, in the repository's tag `v<version>` and in the changelog entry is always the same number, and a version is never reused. Every change is listed in [CHANGELOG.md](./CHANGELOG.md).

## Links

- Documentation and the API reference: https://docs.getclean.ai
- The API contract: https://github.com/deterministic-labs/getclean-api
- Every method of this SDK: [reference.md](./reference.md)
- Changes: [CHANGELOG.md](./CHANGELOG.md)
- Licence: MIT, [LICENSE](./LICENSE)
- Security: write to security@getclean.ai, never a public issue
