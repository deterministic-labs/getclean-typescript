// Generated from the getclean API contract; do not edit.

import * as core from "../core/index.js";
import * as errors from "../errors/index.js";

const TOKEN_PARAM = "apiKey" as const;
const ENV_TOKEN = "GETCLEAN_API_KEY" as const;

export class BearerAuthProvider implements core.AuthProvider {
    private readonly options: BearerAuthProvider.Options;

    constructor(options: BearerAuthProvider.Options) {
        this.options = options;
    }

    public static canCreate(options: Partial<BearerAuthProvider.Options>): boolean {
        return (
            (options?.[TOKEN_PARAM] != null && options?.[TOKEN_PARAM] !== "") ||
            (typeof process !== "undefined" ? process.env?.[ENV_TOKEN] || undefined : undefined) != null
        );
    }

    public async getAuthRequest({
        endpointMetadata,
    }: {
        endpointMetadata?: core.EndpointMetadata | undefined;
    } = {}): Promise<core.AuthRequest> {
        const apiKey =
            (await core.Supplier.get(this.options[TOKEN_PARAM])) ??
            (typeof process !== "undefined" ? process.env?.[ENV_TOKEN] || undefined : undefined);
        if (apiKey == null || apiKey === "") {
            throw new errors.GetCleanError({
                message: BearerAuthProvider.AUTH_CONFIG_ERROR_MESSAGE,
            });
        }

        return {
            headers: { Authorization: `Bearer ${apiKey}` },
        };
    }
}

export namespace BearerAuthProvider {
    export const AUTH_SCHEME = "bearer" as const;
    export const AUTH_CONFIG_ERROR_MESSAGE: string =
        `${TOKEN_PARAM} is required: pass it to the client or set the environment variable ${ENV_TOKEN}.` as const;
    export type Options = AuthOptions;
    export type AuthOptions = {
        /**
         * Every call carries `Authorization: Bearer <key>`.
         *
         * The bearer value is one of two things: an API key, made at `https://app.getclean.ai`; or an access token issued by `https://auth.getclean.ai/realms/getclean` to a person and the program acting for them. A client treats either as opaque. Either one stands for one account, with its scopes, its cap on one call, its budgets, its policy and its default run. An access token's scopes are its `scope` claim, narrowed to what the person approved and never wider.
         *
         * Scopes are explicit and deny by default. Each operation names the scope it needs in its description. One scope depends on the request: `contents:model` is needed only when a call asks for a model step, and the server decides that from the request before any work, so a missing scope is answered before any field is checked.
         *
         * What goes wrong, and how it is answered:
         * - No credential, or one the service does not accept: `401`. The `WWW-Authenticate` header names the document that leads to the sign-in. A credential placed in the query string is ignored and answered the same way.
         * - A credential short of a scope: `403 insufficient-scope`. Every scope the call needs is listed in `scopes_required` and in `WWW-Authenticate`.
         * - A credential that fails is always `401`, never a softer answer.
         */
        [TOKEN_PARAM]?: core.Supplier<core.BearerToken> | undefined;
    };

    export function createInstance(options: Options): core.AuthProvider {
        if (!BearerAuthProvider.canCreate(options)) {
            throw new errors.GetCleanError({
                message: AUTH_CONFIG_ERROR_MESSAGE,
            });
        }
        return new BearerAuthProvider(options);
    }
}
