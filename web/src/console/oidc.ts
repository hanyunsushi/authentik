import * as client from "openid-client";

import { msg } from "@lit/localize";

const ClientID = "kreeper-console-authentik";
const FlowKey = "authentik-console:oauth-flow";
const SessionKey = "authentik-console:oauth-session";
const CallbackPath = "/authentik/auth/callback";

interface Flow {
    verifier: string;
    state: string;
    nonce: string;
    path: string;
    created: number;
}

interface Tokens {
    accessToken: string;
    refreshToken?: string;
    idToken?: string;
    expires: number;
}

function read<T>(key: string): T | null {
    try {
        return JSON.parse(sessionStorage.getItem(key) ?? "null") as T | null;
    } catch {
        sessionStorage.removeItem(key);

        return null;
    }
}

function storedTokens(): Tokens | null {
    const tokens = read<Partial<Tokens>>(SessionKey);

    if (
        !tokens ||
        typeof tokens.accessToken !== "string" ||
        !tokens.accessToken ||
        !Number.isFinite(tokens.expires) ||
        (tokens.refreshToken !== undefined && typeof tokens.refreshToken !== "string") ||
        (tokens.idToken !== undefined && typeof tokens.idToken !== "string")
    ) {
        sessionStorage.removeItem(SessionKey);

        return null;
    }

    return tokens as Tokens;
}

export function safeReturnPath(path: string): string {
    return /^\/if\/(admin|user)\/(?!.*[\\\r\n])/.test(path) ? path : "/";
}

// 认证接入：公开客户端使用标准Code+PKCE，API scope始终按实际用户执行原有权限。
export class ConsoleOIDC {
    readonly serviceURL: string;
    #provider: Promise<client.Configuration> | null = null;
    #refresh: Promise<string> | null = null;
    #epoch = 0;
    #tokens = storedTokens();

    constructor() {
        this.serviceURL = ["127.0.0.1", "localhost"].includes(location.hostname)
            ? "http://127.0.0.1:9000/"
            : "https://oidc.kreeper.cc/";
    }

    get authenticated(): boolean {
        return (
            !!this.#tokens?.accessToken &&
            (this.#tokens.expires > Date.now() || !!this.#tokens.refreshToken)
        );
    }

    #configuration(): Promise<client.Configuration> {
        return (this.#provider ??= client
            .discovery(
                new URL("application/o/console-authentik/", this.serviceURL),
                ClientID,
                { token_endpoint_auth_method: "none" },
                client.None(),
                {
                    execute: [
                        client.enableNonRepudiationChecks,
                        ...(this.serviceURL.startsWith("http:")
                            ? [client.allowInsecureRequests]
                            : []),
                    ],
                },
            )
            .catch((error: unknown) => {
                this.#provider = null;
                throw error;
            }));
    }

    #save(tokens: Awaited<ReturnType<typeof client.authorizationCodeGrant>>): void {
        this.#tokens = {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token ?? this.#tokens?.refreshToken,
            idToken: tokens.id_token ?? this.#tokens?.idToken,
            expires: Date.now() + (tokens.expires_in ?? 300) * 1000,
        };

        sessionStorage.setItem(SessionKey, JSON.stringify(this.#tokens));
    }

    clear(): void {
        this.#epoch++;
        this.#tokens = null;
        sessionStorage.removeItem(SessionKey);
    }

    async login(path: string, selectAccount = false): Promise<void> {
        const config = await this.#configuration();

        const flow: Flow = {
            verifier: client.randomPKCECodeVerifier(),
            state: client.randomState(),
            nonce: client.randomNonce(),
            path: safeReturnPath(path),
            created: Date.now(),
        };

        sessionStorage.setItem(FlowKey, JSON.stringify(flow));

        const url = client.buildAuthorizationUrl(config, {
            redirect_uri: new URL(CallbackPath, location.origin).href,
            scope: "openid profile email offline_access goauthentik.io/api",
            response_type: "code",
            state: flow.state,
            nonce: flow.nonce,
            code_challenge: await client.calculatePKCECodeChallenge(flow.verifier),
            code_challenge_method: "S256",
            ...(selectAccount ? { prompt: "select_account" } : {}),
        });

        location.assign(url.href);
    }

    async callback(): Promise<string> {
        const flow = read<Flow>(FlowKey);
        sessionStorage.removeItem(FlowKey);
        const url = new URL(location.href);
        // 认证回调：在异步交换之前移除地址栏中的一次性授权材料，不写入页面/日志。
        history.replaceState(history.state, "", CallbackPath);

        if (
            !flow ||
            typeof flow.verifier !== "string" ||
            typeof flow.state !== "string" ||
            typeof flow.nonce !== "string" ||
            typeof flow.path !== "string" ||
            !Number.isFinite(flow.created) ||
            flow.created > Date.now() ||
            Date.now() - flow.created > 600_000
        )
            throw new Error(
                msg("Login callback expired. Please log in again.", {
                    id: "console.login.callback.error",
                }),
            );

        const tokens = await client.authorizationCodeGrant(await this.#configuration(), url, {
            pkceCodeVerifier: flow.verifier,
            expectedState: flow.state,
            expectedNonce: flow.nonce,
            idTokenExpected: true,
        });

        this.#save(tokens);

        return safeReturnPath(flow.path);
    }

    accessToken = async (): Promise<string> => {
        if (!this.#tokens) return "";

        if (this.#tokens.expires > Date.now() + 30_000) return this.#tokens.accessToken;

        if (!this.#tokens.refreshToken) {
            this.clear();
            throw new Error(
                msg("Session expired. Please log in again.", { id: "console.login.session.error" }),
            );
        }

        const refreshToken = this.#tokens.refreshToken;
        const epoch = this.#epoch;

        return (this.#refresh ??= (async () =>
            client.refreshTokenGrant(await this.#configuration(), refreshToken))()
            .then((tokens) => {
                if (epoch !== this.#epoch) throw new Error("Session invalidated");
                this.#save(tokens);

                return tokens.access_token;
            })
            .catch((error: unknown) => {
                this.clear();
                throw error;
            })
            .finally(() => {
                this.#refresh = null;
            }));
    };

    async logout(): Promise<void> {
        const tokens = this.#tokens;
        this.clear();
        const config = await this.#configuration();

        if (tokens?.refreshToken)
            await client.tokenRevocation(config, tokens.refreshToken).catch(() => {});

        const url = client.buildEndSessionUrl(config, {
            client_id: ClientID,
            post_logout_redirect_uri: new URL("/authentik/", location.origin).href,
            ...(tokens?.idToken ? { id_token_hint: tokens.idToken } : {}),
        });

        location.assign(url.href);
    }
}
