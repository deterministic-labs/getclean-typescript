export type BinaryResponse = {
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Request/bodyUsed) */
    bodyUsed: Response["bodyUsed"];
    /**
     * Returns a ReadableStream of the response body (an empty stream when the response has no body,
     * as `arrayBuffer()`, `blob()` and `bytes()` return empty values then).
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Request/body)
     */
    stream: () => NonNullable<Response["body"]>;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Request/arrayBuffer) */
    arrayBuffer: () => ReturnType<Response["arrayBuffer"]>;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/Request/blob) */
    blob: () => ReturnType<Response["blob"]>;
    /**
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Request/bytes)
     * Where the Fetch API has no `bytes()` method, returns the bytes of `arrayBuffer()`.
     */
    bytes: () => Promise<Uint8Array<ArrayBuffer>>;
};

export function getBinaryResponse(response: Response): BinaryResponse {
    return {
        get bodyUsed() {
            return response.bodyUsed;
        },
        stream: () =>
            response.body ??
            new ReadableStream<Uint8Array<ArrayBuffer>>({
                start: (controller) => controller.close(),
            }),
        arrayBuffer: response.arrayBuffer.bind(response),
        blob: response.blob.bind(response),
        bytes:
            "bytes" in response && typeof response.bytes === "function"
                ? response.bytes.bind(response)
                : async () => new Uint8Array(await response.arrayBuffer()),
    };
}
