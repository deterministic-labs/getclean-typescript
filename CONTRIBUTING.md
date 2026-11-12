# Contributing

Thank you for taking the time to help.

## How this repository is built

Most of this SDK is generated from the getclean API's contract, one OpenAPI 3.1 file kept in the [getclean-api](https://github.com/deterministic-labs/getclean-api) repository. A change made to a generated file is lost at the next generation, so a problem in generated code is best reported as an issue here; it is fixed at its source and reaches the package at the next release.

The hand-written part is small: `src/wrapper/GetClean.ts`, `src/wrapper/layer.ts`, `src/wrapper/JobCanceled.ts`, `src/wrapper/GetClean.errors.ts` and the tests under `tests/layer/`. Three more files, `src/index.ts`, `src/wrapper/GetClean.namespace.ts` and `src/wrapper/problemTypes.ts`, are derived from the contract and the generated client when the SDK is built and are never edited by hand. Changes to the hand-written files are welcome as pull requests.

## Reporting a problem

Open an issue with the version of `getclean`, your Node.js version, the call you made and what came back. Never paste your API key. For a security problem, see `SECURITY.md`.

## Running the checks

The tests need Node.js 20.19 or later and pnpm, at the version `package.json` names under `packageManager`.

```sh
pnpm install --frozen-lockfile
pnpm run check
pnpm run build
pnpm run test --run
```

## Pull requests

One change per pull request, with a test where the change has behavior. Run the four commands above before you open it. Write the commit subject in the imperative, capitalized, without a final period, and say in the body why the change is right when that is not plain from the diff.
