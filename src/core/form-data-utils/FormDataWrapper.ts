import { toMultipartDataPart, type Uploadable } from "../../core/file/index.js";
import { toJson } from "../../core/json.js";
import { RUNTIME } from "../runtime/index.js";

/**
 * The value of a scalar form part as the wire carries it: a Date as its ISO instant with seconds, the form the JSON
 * body gives it (JSON.stringify calls toJSON); every other value as it is, written by the platform's own string form.
 */
function formPartValue(value: unknown): unknown {
    return value instanceof Date ? value.toISOString() : value;
}

interface FormDataRequest<Body> {
    body: Body;
    headers: Record<string, string>;
    duplex?: "half" | undefined;
}

export async function newFormData(): Promise<FormDataWrapper> {
    return new FormDataWrapper();
}

export class FormDataWrapper {
    private fd: FormData = new FormData();

    public async setup(): Promise<void> {
        // noop
    }

    public append(key: string, value: unknown, contentType?: string): void {
        const part = formPartValue(value);
        if (contentType != null) {
            this.fd.append(key, new Blob([String(part)], { type: contentType }), "");
            return;
        }
        this.fd.append(key, String(part));
    }

    public async appendFile(key: string, value: Uploadable): Promise<void> {
        if (value == null) {
            throw new Error(
                `File upload for "${key}" received ${value === null ? "null" : "undefined"}. The generated code should not call appendFile with null/undefined — check that optional file fields are guarded before this call.`,
            );
        }
        const { data, filename, contentType } = await toMultipartDataPart(value);
        const blob = await convertToBlob(data, contentType);
        if (filename) {
            this.fd.append(key, blob, filename);
        } else {
            this.fd.append(key, blob);
        }
    }

    public getRequest(): FormDataRequest<FormData> {
        return {
            body: this.fd,
            headers: {},
            duplex: "half" as const,
        };
    }
}

type StreamLike = {
    read?: (() => unknown) | undefined;
    pipe?: ((dest: unknown) => unknown) | undefined;
} & unknown;

function isStreamLike(value: unknown): value is StreamLike {
    return typeof value === "object" && value != null && ("read" in value || "pipe" in value);
}

function isReadableStream(value: unknown): value is ReadableStream {
    return typeof value === "object" && value != null && "getReader" in value;
}

function isBuffer(value: unknown): value is Buffer {
    return typeof Buffer !== "undefined" && Buffer.isBuffer && Buffer.isBuffer(value);
}

function isArrayBufferView(value: unknown): value is ArrayBufferView {
    return ArrayBuffer.isView(value);
}

async function streamToBuffer(stream: unknown): Promise<Buffer> {
    if (RUNTIME.type === "node") {
        const { Readable } = await import("stream");

        if (stream instanceof Readable) {
            const chunks: Buffer[] = [];
            for await (const chunk of stream) {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            }
            return Buffer.concat(chunks);
        }
    }

    if (isReadableStream(stream)) {
        const reader = stream.getReader();
        const chunks: Uint8Array[] = [];

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
            }
        } finally {
            reader.releaseLock();
        }

        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
            result.set(chunk, offset);
            offset += chunk.length;
        }

        return Buffer.from(result);
    }

    throw new Error(
        `Unsupported stream type: ${typeof stream}. Expected Node.js Readable stream or Web ReadableStream.`,
    );
}

async function convertToBlob(value: unknown, contentType?: string): Promise<Blob> {
    // A Blob's options name a type only when there is one: under `exactOptionalPropertyTypes` an optional member may
    // be left out, but not set to `undefined`.
    const options: ConstructorParameters<typeof Blob>[1] = contentType != null ? { type: contentType } : undefined;
    if (isStreamLike(value) || isReadableStream(value)) {
        const buffer = await streamToBuffer(value);
        return new Blob([buffer as BlobPart], options);
    }

    if (value instanceof Blob) {
        return value;
    }

    if (isBuffer(value)) {
        return new Blob([value as BlobPart], options);
    }

    if (value instanceof ArrayBuffer) {
        return new Blob([value], options);
    }

    if (isArrayBufferView(value)) {
        return new Blob([value as BlobPart], options);
    }

    if (typeof value === "string") {
        return new Blob([value], options);
    }

    if (typeof value === "object" && value !== null) {
        return new Blob([toJson(value)], { type: contentType ?? "application/json" });
    }

    return new Blob([String(value)], options);
}
