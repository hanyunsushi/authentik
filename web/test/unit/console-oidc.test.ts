import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// 协议边界：SDK处理签名/issuer；测试本应用的一次性状态、返回路径与刷新生命周期。
const sdk = vi.hoisted(() => ({ discovery: vi.fn(), grant: vi.fn(), refresh: vi.fn() }));

vi.mock("openid-client", () => ({
    discovery: sdk.discovery,
    authorizationCodeGrant: sdk.grant,
    refreshTokenGrant: sdk.refresh,
    None: () => undefined,
    enableNonRepudiationChecks: () => {},
    allowInsecureRequests: () => {},
}));

import { ConsoleOIDC, safeReturnPath } from "#console/oidc";

const sessionKey = "authentik-console:oauth-session";
const flowKey = "authentik-console:oauth-flow";
let storage: Map<string, string>;

beforeEach(() => {
    storage = new Map();

    vi.stubGlobal("sessionStorage", {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
    });

    vi.stubGlobal("location", {
        hostname: "127.0.0.1",
        origin: "http://127.0.0.1:4316",
        href: "http://127.0.0.1:4316/authentik/auth/callback?code=example&state=expected",
    });

    vi.stubGlobal("history", { state: null, replaceState: vi.fn() });
    sdk.discovery.mockResolvedValue({});
    sdk.grant.mockResolvedValue({ access_token: "example", expires_in: 300 });
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
});

describe("ConsoleOIDC", () => {
    it("rejects external and cross-project return paths", () => {
        for (const path of [
            "//evil.invalid",
            "https://evil.invalid",
            "/kreepai/",
            "/if/user/\\evil",
            "/if/admin/\n",
        ])
            expect(safeReturnPath(path)).toBe("/");

        expect(safeReturnPath("/if/user/settings?tab=password#form")).toBe(
            "/if/user/settings?tab=password#form",
        );
    });

    it("discards malformed stored sessions", () => {
        storage.set(sessionKey, JSON.stringify({ accessToken: "example", expires: "tomorrow" }));
        expect(new ConsoleOIDC().authenticated).toBe(false);
        expect(storage.has(sessionKey)).toBe(false);
    });

    it("consumes PKCE state once and removes callback material before exchanging it", async () => {
        storage.set(
            flowKey,
            JSON.stringify({
                verifier: "proof",
                state: "expected",
                nonce: "nonce",
                path: "/if/user/library",
                created: Date.now(),
            }),
        );

        const oidc = new ConsoleOIDC();
        expect(await oidc.callback()).toBe("/if/user/library");
        expect(history.replaceState).toHaveBeenCalledWith(null, "", "/authentik/auth/callback");

        expect(sdk.grant.mock.calls[0][2]).toEqual({
            pkceCodeVerifier: "proof",
            expectedState: "expected",
            expectedNonce: "nonce",
            idTokenExpected: true,
        });

        await expect(oidc.callback()).rejects.toThrow(/expired/);
        expect(sdk.grant).toHaveBeenCalledTimes(1);
    });

    it("rejects expired callback state before contacting the provider", async () => {
        storage.set(
            flowKey,
            JSON.stringify({
                verifier: "proof",
                state: "expected",
                nonce: "nonce",
                path: "/",
                created: Date.now() - 600001,
            }),
        );

        await expect(new ConsoleOIDC().callback()).rejects.toThrow(/expired/);
        expect(sdk.discovery).not.toHaveBeenCalled();
    });

    it("shares one token rotation across concurrent requests", async () => {
        storage.set(
            sessionKey,
            JSON.stringify({ accessToken: "old", refreshToken: "refresh", expires: 0 }),
        );

        sdk.refresh.mockResolvedValue({
            access_token: "rotated",
            refresh_token: "next",
            expires_in: 300,
        });

        const oidc = new ConsoleOIDC();

        expect(await Promise.all([oidc.accessToken(), oidc.accessToken()])).toEqual([
            "rotated",
            "rotated",
        ]);

        expect(sdk.refresh).toHaveBeenCalledTimes(1);
    });

    it("does not restore a session cleared during an outstanding refresh", async () => {
        storage.set(
            sessionKey,
            JSON.stringify({ accessToken: "old", refreshToken: "refresh", expires: 0 }),
        );

        let complete!: (tokens: unknown) => void;

        sdk.refresh.mockImplementation(
            () =>
                new Promise((resolve) => {
                    complete = resolve;
                }),
        );

        const oidc = new ConsoleOIDC();
        const request = oidc.accessToken();
        await vi.waitFor(() => expect(complete).toBeDefined());
        oidc.clear();
        complete({ access_token: "late", expires_in: 300 });
        await expect(request).rejects.toThrow(/invalidated/);
        expect(storage.has(sessionKey)).toBe(false);
    });
});
