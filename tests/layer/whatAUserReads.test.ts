/**
 * What a user reads. TypeScript keeps no documentation at run time, so these tests read the source files an editor
 * reads. The layer's overrides carry no JSDoc of their own, so the editor shows the generated one, which opens with
 * the contract's first sentence of the operation; the client's own JSDoc names the credential and the host; and the
 * files derived when the SDK is built say so and name nothing of the tools that make them.
 */

import { readFileSync } from "node:fs";
import ts from "typescript";

/** The URL of a source file of the SDK. */
function sourceUrl(file: string): URL {
    return new URL(`../../src/${file}`, import.meta.url);
}

/** A source file of the SDK, parsed. */
function parsed(file: string): ts.SourceFile {
    const text = readFileSync(sourceUrl(file), "utf8");
    return ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
}

/** The class of this name in the file. */
function classNamed(file: ts.SourceFile, name: string): ts.ClassDeclaration {
    const found = file.statements.find(
        (statement): statement is ts.ClassDeclaration =>
            ts.isClassDeclaration(statement) && statement.name?.text === name,
    );
    if (found == null) {
        throw new Error(`no class ${name} in ${file.fileName}`);
    }
    return found;
}

/** The text of the JSDoc that stands right above a declaration, or undefined when none does. */
function jsDocOf(node: ts.Node): string | undefined {
    const docs = ts.getJSDocCommentsAndTags(node).filter(ts.isJSDoc);
    const last = docs.at(-1);
    return last == null ? undefined : (ts.getTextOfJSDocComment(last.comment) ?? "");
}

/** The public methods of a class by name. */
function methodsOf(declaration: ts.ClassDeclaration): Map<string, ts.MethodDeclaration> {
    const methods = new Map<string, ts.MethodDeclaration>();
    for (const member of declaration.members) {
        if (ts.isMethodDeclaration(member) && ts.isIdentifier(member.name)) {
            methods.set(member.name.text, member);
        }
    }
    return methods;
}

function isOverride(method: ts.MethodDeclaration): boolean {
    return ts.getModifiers(method)?.some((modifier) => modifier.kind === ts.SyntaxKind.OverrideKeyword) ?? false;
}

/**
 * The operations the layer overrides, the eight that may bill and the two lists that grow while they page, each with
 * the first sentence of its description in the contract.
 */
const OVERRIDES: Array<[string, string]> = [
    ["fetchContents", "Fetch a web page or a document at a URL."],
    ["fetchContentsBatch", "Fetch 1 to 20 pages or documents at their URLs in one call."],
    [
        "highlightContents",
        "Find words or questions in a record you already have and mark where they stand, without fetching again.",
    ],
    ["fillSchema", "Fill your JSON Schema from a record you already have."],
    [
        "summarizeContents",
        "Have a model write a summary of a record you already have, at most 1,500 characters in the content's language, from the copy getclean keeps.",
    ],
    ["uploadContents", "Read a document you hold, or one at a URL that needs more time than a fetch gives."],
    [
        "search",
        "Search up to ten datasources with one question, in up to twenty wordings, and get one ranked list of results with the facts of each and a receipt of what ran where, before any page is read.",
    ],
    ["searchBatch", "Run 1 to 20 searches in one call, one record each."],
    ["listJobs", "List the account's jobs, newest first, free."],
    ["listContents", "List the records the account keeps, newest first, free."],
];

const LAYER = classNamed(parsed("wrapper/GetClean.ts"), "GetClean");
const GENERATED = classNamed(parsed("Client.ts"), "GetClean");

/** The two lists the layer filters for repeats: they grow while a caller pages through them. */
const LISTS_THAT_GROW = ["listJobs", "listContents"];

/** The calls that may bill: the contract's eight operations whose parameters carry an Idempotency-Key. */
const CALLS_THAT_MAY_BILL = [
    "fetchContents",
    "fetchContentsBatch",
    "highlightContents",
    "fillSchema",
    "summarizeContents",
    "uploadContents",
    "search",
    "searchBatch",
];

describe("the documentation of the client's methods", () => {
    it("overrides the contract's eight calls that may bill and the two lists that grow, and no other method", () => {
        // The layer's set is the eight operations whose parameters carry a key, and the two lists the repeat filter
        // runs on, which grow while they page.
        const overridden = [...methodsOf(LAYER).values()].filter(isOverride).map((method) => method.name.getText());

        expect(overridden.sort()).toEqual([...CALLS_THAT_MAY_BILL, ...LISTS_THAT_GROW].sort());
        expect(OVERRIDES.map(([name]) => name).sort(), "the sentences below cover every override").toEqual(
            overridden.sort(),
        );
    });

    it.each(OVERRIDES)("leaves %s without a JSDoc of its own, so the editor shows the generated one", (name) => {
        // An override with no JSDoc of its own inherits the generated description in the editor; one of its own
        // would hide it: the layer's documents say what the layer does, the contract's what the API does.
        const method = methodsOf(LAYER).get(name);

        expect(method, `the layer overrides ${name}`).toBeDefined();
        expect(jsDocOf(method as ts.MethodDeclaration), "no JSDoc of the override's own").toBeUndefined();
    });

    it.each(
        OVERRIDES,
    )("documents %s in the generated client, opening with the contract's first sentence", (name, sentence) => {
        // The description the editor shows is the generated one, from the contract.
        const method = methodsOf(GENERATED).get(name);

        expect(method, `the generated client declares ${name}`).toBeDefined();
        expect(jsDocOf(method as ts.MethodDeclaration)?.startsWith(sentence), sentence).toBe(true);
    });
});

describe("the documentation of the client", () => {
    it("names the credential and the host in the client's own JSDoc", () => {
        // The client's JSDoc is the first text a developer reads: it names apiKey and GETCLEAN_API_KEY, the
        // production host, baseUrl and GETCLEAN_BASE_URL.
        const doc = jsDocOf(LAYER);

        expect(doc, "the layer's own JSDoc on the client").toBeDefined();
        for (const name of ["apiKey", "GETCLEAN_API_KEY", "https://api.getclean.ai", "baseUrl", "GETCLEAN_BASE_URL"]) {
            expect(doc, `the JSDoc names ${name}`).toContain(name);
        }
    });
});

describe("the files derived when the SDK is built", () => {
    it.each([
        // Each derived file and what it is derived from: the contract's problem types, or the generated client.
        ["index.ts", "the generated client"],
        ["wrapper/problemTypes.ts", "the getclean API contract's problem types"],
        ["wrapper/GetClean.namespace.ts", "the generated client"],
    ])("%s opens with one sentence: derived from %s when the SDK is built, and not to be edited", (file, source) => {
        // A derived file's first line says what the file is derived from, that it is derived when the SDK is built,
        // and not to edit it, and says nothing else.
        const [firstLine] = readFileSync(sourceUrl(file), "utf8").split("\n");

        expect(firstLine, "the header's own sentence, whole").toBe(
            `// Derived from ${source} when the SDK is built; do not edit.`,
        );
    });
});
