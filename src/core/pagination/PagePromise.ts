import type { Page } from "./Page.js";

/**
 * The promise of a page that is itself iterable: `for await (const item of client.listJobs())` walks every item of every
 * page with no `await` on the call, `await client.listJobs()` gives the first page as before, and a page's own members
 * are read from that page. One request is made when the promise is first awaited or iterated.
 */
export class PagePromise<T, R = unknown> extends Promise<Page<T, R>> implements AsyncIterable<T> {
    private readonly innerPromise: Promise<Page<T, R>>;

    private constructor(promise: Promise<Page<T, R>>) {
        // Initialize with a no-op: the inner promise carries the page
        super((resolve) => {
            resolve(undefined as unknown as Page<T, R>);
        });
        this.innerPromise = promise;
    }

    public static fromPromise<T, R = unknown>(promise: Promise<Page<T, R>>): PagePromise<T, R> {
        return new PagePromise<T, R>(promise);
    }

    public override then<TResult1 = Page<T, R>, TResult2 = never>(
        onfulfilled?: ((value: Page<T, R>) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ): Promise<TResult1 | TResult2> {
        return this.innerPromise.then(onfulfilled, onrejected);
    }

    public override catch<TResult = never>(
        onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null,
    ): Promise<Page<T, R> | TResult> {
        return this.innerPromise.catch(onrejected);
    }

    public override finally(onfinally?: (() => void) | null): Promise<Page<T, R>> {
        return this.innerPromise.finally(onfinally);
    }

    public async *[Symbol.asyncIterator](): AsyncIterator<T, void, unknown> {
        const page = await this.innerPromise;
        for await (const item of page) {
            yield item;
        }
    }
}
