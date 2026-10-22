import type { ConsoleInterface } from "./Interface";
import { ConsoleOIDC, safeReturnPath } from "./oidc";

import { resetAPIClients, aki } from "#common/api/client";
import { setConsoleRuntime, type ConsoleContext } from "#common/console";
import { configureServerContext } from "#common/global";
import { autoDetectLanguage } from "#common/ui/locale/utils";

import { canAccessAdmin } from "#elements/mixins/session";

import {
    Configuration,
    CoreApi,
    RootApi,
    AdminApi,
    ResponseError,
    type SessionUser,
} from "@goauthentik/api";

import { msg } from "@lit/localize";
import { render, html } from "lit";
import "#elements/messages/MessageContainer";

export async function mount(container: HTMLElement, context: ConsoleContext) {
    const oidc = new ConsoleOIDC();
    const requests = new AbortController();
    let disposed = false;
    let root: ConsoleInterface | null = null;
    let path = context.initialPath;
    let session: SessionUser | null = null;
    const messages = document.createElement("ak-message-container");
    const login = async (selectAccount = false) => oidc.login(path, selectAccount);

    const logout = async () => {
        context.onSession?.({ authenticated: false, isAdmin: false, username: "" });
        context.onNavigation?.([{ key: "home", label: "Authentik", path: "/", public: true }]);
        await oidc.logout();
    };

    const onSession = (value: SessionUser) => {
        session = value;

        context.onSession?.({
            authenticated: value.user.pk !== -1,
            isAdmin: !!canAccessAdmin(value.user),
            username: value.user.username,
        });
    };

    const unmount = () => {
        if (disposed) return;
        disposed = true;
        requests.abort();
        root?.remove();
        render(null, container);
        container.replaceChildren();
        container.classList.remove("console-authentik-surface");
        context.topbarTarget?.classList.remove("console-authentik-surface");
        resetAPIClients();
        setConsoleRuntime(null);
        configureServerContext(null);
    };

    try {
        container.classList.add("console-authentik-surface");
        context.topbarTarget?.classList.add("console-authentik-surface");
        context.onPageLayout?.("page");
        context.onTopbarActions([]);
        context.onVersion?.(import.meta.env.AK_VERSION);

        if (path.split("?", 1)[0] === "/auth/callback") path = await oidc.callback();

        // 微前端接入：启动数据仍由生成客户端获取，公开配置与真实身份完成后再发布外壳。
        const configuration = new Configuration({
            basePath: new URL("/api/authentik/api/v3", location.origin).href,
            accessToken: oidc.accessToken,
            credentials: "omit",
        });

        const core = new CoreApi(configuration);

        const publicConfiguration = new Configuration({
            basePath: configuration.basePath,
            credentials: "omit",
        });

        const [config, brand] = await Promise.all([
            new RootApi(publicConfiguration).rootConfigRetrieve({ signal: requests.signal }),
            new CoreApi(publicConfiguration).coreBrandsCurrentRetrieve({ signal: requests.signal }),
        ]);

        if (oidc.authenticated) {
            try {
                session = await core.coreUsersMeRetrieve({ signal: requests.signal });
            } catch (error) {
                if (
                    !oidc.authenticated ||
                    (error instanceof ResponseError && [401, 403].includes(error.response.status))
                ) {
                    oidc.clear();
                    session = null;
                } else throw error;
            }
        }

        configureServerContext({
            locale: autoDetectLanguage(session?.user.settings.locale),
            config,
            brand,
            versionFamily: import.meta.env.AK_VERSION.split(".").slice(0, 2).join("."),
            versionSubdomain: "",
            build: "",
            api: { base: new URL("/api/authentik/", location.origin).href, relBase: "/authentik/" },
        });

        setConsoleRuntime({
            context,
            serviceURL: oidc.serviceURL,
            signal: requests.signal,
            accessToken: oidc.accessToken,
            login,
            logout,
            onSession,
        });

        resetAPIClients();

        const navigate = async (nextPath: string) => {
            if (disposed) return;
            path = nextPath;

            if (!session) return;
            const next = safeReturnPath(path);

            if (next === "/") {
                context.onNavigate(
                    canAccessAdmin(session.user)
                        ? "/if/admin/administration/overview"
                        : "/if/user/library",
                );

                return;
            }

            if (!root) {
                const { ConsoleInterface: Interface } = await import("./Interface");

                if (disposed) return;
                root = new Interface();
                root.setPath(next);
                container.replaceChildren(root, messages);
            } else root.setPath(next);

            await root.updateComplete;
        };

        if (session) {
            onSession(session);
            context.onHeader?.({ mounted: true, title: "Authentik", ready: true });
            await navigate(path);
        } else {
            context.onSession?.({ authenticated: false, isAdmin: false, username: "" });
            context.onNavigation?.([{ key: "home", label: "Authentik", path: "/", public: true }]);
            context.onHeader?.({ mounted: false, title: "Authentik", ready: true });

            context.onTopbarActions([
                {
                    key: "login",
                    label: msg("Log in", { id: "console.login.label" }),
                    variant: "primary",
                },
            ]);

            // 提示信息 / 普通按钮：公开入口只展示登录引导，业务页面在身份核验后挂载。
            render(
                html`<section
                    class="console-authentik-welcome"
                    data-design-id="console-authentik-welcome"
                >
                    <h1>Authentik</h1>
                    <p>
                        ${msg("Log in to manage identities, applications, and access.", { id: "console.welcome.description" })}
                    </p>
                    <button
                        class="pf-c-button pf-m-primary"
                        data-testid="console-authentik-login"
                        @click=${() => login()}
                    >
                        ${msg("Log in", { id: "console.login.label" })}
                    </button>
                </section>`,
                container,
            );
        }

        return {
            navigate,
            unmount,
            logout,
            dispatchTopbarAction: (key: string) => {
                if (key === "login") void login();
            },
            checkVersion: async () => {
                context.onVersionStatus?.({ state: "checking" });

                try {
                    const version = await aki(AdminApi).adminVersionRetrieve();

                    context.onVersionStatus?.({
                        state: version.outdated ? "available" : "current",
                        latest: version.versionLatest.version,
                    });
                } catch {
                    context.onVersionStatus?.({ state: "error" });
                }
            },
        };
    } catch (error) {
        unmount();
        throw error;
    }
}
