import { describe, expect, it } from "vitest";

import { getBinaryResponse } from "../../../src/core/fetcher/BinaryResponse";

describe("BinaryResponse", () => {
    describe("getBinaryResponse", () => {
        it("should return an empty stream when the response has no body", async () => {
            const response = new Response(null, { status: 200 });
            expect(response.body).toBeNull();

            const { done } = await getBinaryResponse(response).stream().getReader().read();
            expect(done).toBe(true);
        });

        it("should read bytes through arrayBuffer() when the Fetch API has no bytes()", async () => {
            const response = new Response("test bytes");
            Object.defineProperty(response, "bytes", { value: undefined });

            const bytes = await getBinaryResponse(response).bytes();
            expect(bytes).toBeInstanceOf(Uint8Array);
            expect(new TextDecoder().decode(bytes)).toBe("test bytes");
        });
    });
});
